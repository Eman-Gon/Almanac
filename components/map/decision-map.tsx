"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  LocateFixed,
  MapPin,
  Minus,
  Package,
  Plus,
  Truck,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { MapLayers, MapRouteStop, MapRouteSummary } from "@/components/shared/network-map";
import { partners, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import { scenarioContext } from "@/domain/planning/scenario-context";
import type { Mission, PartnerAgency, PlanOption } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";
import {
  boundsCenter,
  boundsOf,
  fitZoom,
  MAX_TILE_ZOOM,
  MIN_TILE_ZOOM,
  project,
  unproject,
  visibleTiles,
  windowState,
  type GeoBounds,
  type LatLng,
  type WindowState,
  type WorldPoint,
} from "@/components/map/projection";
import styles from "@/components/map/decision-map.module.css";

const SVG_HALF = 32768;
const FLEET_ID = "FLEET";

// Kept in lockstep with the shared NetworkMap copy so cross-page flows read
// identically; NetworkMap does not export its internal note map.
const routeSummaryNotes: Record<MapRouteSummary["status"], string> = {
  candidate: "Candidate route shown for decision context.",
  approved: "Human-approved route currently in execution.",
  disrupted: "A canceled stop requires human-approved replanning.",
  replanned: "Human-approved replacement route is active.",
  superseded: "Original route superseded by the human-approved replacement mission.",
  delivered: "Delivered route retained for impact and audit context.",
  closed: "Closed mission retained for audit context.",
};

type SelectionSource = "marker" | "location";

type Viewport = { center: LatLng; zoom: number };

type PartnerView = {
  partner: PartnerAgency;
  status: string;
  demandLb: number;
  urgency: string;
  coverage: number;
  diameter: number;
  window: WindowState;
  windowLabel: string;
  routeStop?: MapRouteStop;
  ghostOnly: boolean;
  excludedReason?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatClockDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Deterministic scenario clock: every stage of the demo has a seeded
 * timestamp, so "now" is auditable instead of wall-clock dependent.
 */
function scenarioNowIso(stage: string): string {
  const timeline = scenarioContext.timeline;
  if (stage === "recovered") return timeline.recoveryMissionEventAt;
  if (stage === "disrupted") return timeline.disruptionAt;
  if (stage === "approved") return timeline.missionAssignedAt;
  return timeline.planGeneratedAt;
}

function deadlineRemainingLabel(nowIso: string): string {
  const remainingMs = Date.parse(productLot.riskDeadline) - Date.parse(nowIso);
  if (remainingMs <= 0) return "Deadline passed";
  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.round((remainingMs % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m left`;
}

function windowLabelFor(state: WindowState, window?: { start: string; end: string }): string {
  if (!window) return "Receiving window unknown";
  if (state.kind === "closed") return `Window closed ${formatTime(window.end)}`;
  if (state.kind === "upcoming") return `Window opens ${formatTime(window.start)}`;
  if (state.minutesRemaining < 90) return `Window closes in ${state.minutesRemaining} min`;
  return `Window open until ${formatTime(window.end)}`;
}

function windowToneClass(state: WindowState): string {
  if (state.kind === "closed") return styles.ringClosed;
  if (state.kind === "upcoming") return styles.ringUpcoming;
  if (state.minutesRemaining < 30) return styles.ringCritical;
  if (state.minutesRemaining < 90) return styles.ringWarning;
  return styles.ringOpen;
}

function statusToneClass(status: string): string {
  if (status === "available") return styles.toneAvailable;
  if (status === "limited") return styles.toneLimited;
  return styles.toneOut;
}

function statusLabel(status: string): string {
  if (status === "canceled") return "Canceled";
  if (status === "unavailable") return "Unavailable";
  if (status === "limited") return "Limited capacity";
  return "Available";
}

function legControlPoint(from: WorldPoint, to: WorldPoint): WorldPoint {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bow = Math.min(length * 0.16, 36);
  return { x: midX - (dy / length) * bow, y: midY + (dx / length) * bow };
}

function quadraticPath(points: WorldPoint[]): string {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const control = legControlPoint(points[index], points[index + 1]);
    path += ` Q ${control.x} ${control.y} ${points[index + 1].x} ${points[index + 1].y}`;
  }
  return path;
}

function legMidpoint(from: WorldPoint, to: WorldPoint): WorldPoint {
  const control = legControlPoint(from, to);
  const onCurve = {
    x: 0.25 * from.x + 0.5 * control.x + 0.25 * to.x,
    y: 0.25 * from.y + 0.5 * control.y + 0.25 * to.y,
  };
  // Push the label further along the bow normal so it clears the line and
  // any stop glyphs sitting near the leg midpoint.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: onCurve.x - (dy / length) * 15, y: onCurve.y + (dx / length) * 15 };
}

function PartnerGlyph({ view }: { view: PartnerView }) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = view.window.kind === "open" ? view.window.fractionRemaining : 0;
  const inactive = view.status === "canceled" || view.status === "unavailable";
  return (
    <svg viewBox="0 0 44 44" className={styles.glyph} aria-hidden="true" focusable="false">
      {view.window.kind === "open" ? (
        <circle
          className={`${styles.windowRing} ${windowToneClass(view.window)}`}
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={`${arcFraction * circumference} ${circumference}`}
          transform="rotate(-90 22 22)"
        />
      ) : (
        <circle
          className={`${styles.windowRing} ${windowToneClass(view.window)}`}
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={view.window.kind === "closed" ? "2.4 4.2" : "0.8 5"}
        />
      )}
      <circle className={styles.vessel} cx="22" cy="22" r="14" />
      <clipPath id={`vessel-${view.partner.id}`}>
        <circle cx="22" cy="22" r="12.6" />
      </clipPath>
      {!inactive ? (
        <rect
          className={styles.vesselFill}
          clipPath={`url(#vessel-${view.partner.id})`}
          x="9"
          y={22 + 12.6 - view.coverage * 25.2}
          width="26"
          height={view.coverage * 25.2}
        />
      ) : null}
      <circle className={styles.vesselStroke} cx="22" cy="22" r="14" />
      {view.status === "canceled" || view.routeStop?.status === "canceled" ? (
        <path className={styles.canceledMark} d="M16 16 L28 28 M28 16 L16 28" />
      ) : null}
    </svg>
  );
}

function ScoreBreakdown({ plan, destinationId }: { plan: PlanOption; destinationId: string }) {
  const allocation = plan.allocations.find((item) => item.destinationId === destinationId);
  if (!allocation) return null;
  const score = allocation.score;
  const penalties = score.travelPenalty + score.spoilagePenalty + score.refusalRiskPenalty;
  return (
    <div className={styles.scoreRow} aria-label={`Deterministic destination score ${score.total} of 100`}>
      <span className={styles.scoreTotal}>{score.total}</span>
      <span className={styles.scoreMeta}>
        <strong>Destination score · {scenarioContext.scenario.scoreConfigVersion}</strong>
        <small>
          Need {score.documentedNeed} · capacity {score.availableCapacity} · history {score.historicalAcceptance} · penalties −{penalties}
        </small>
      </span>
    </div>
  );
}

export function DecisionMap({
  layers,
  routeSummary,
  routeStops,
  routeLegs,
  ghostRouteStops,
  activePlan,
  selectedLocationId: controlledSelectedLocationId,
  onSelectedLocationChange,
}: {
  layers: MapLayers;
  routeSummary: MapRouteSummary;
  routeStops: MapRouteStop[];
  routeLegs?: Mission["routeLegs"];
  ghostRouteStops?: MapRouteStop[];
  activePlan?: PlanOption;
  selectedLocationId?: string | null;
  onSelectedLocationChange?: (id: string | null) => void;
}) {
  const { state } = useDemoState();
  const nowIso = scenarioNowIso(state.stage);

  const orderedStops = useMemo(
    () => routeStops.slice().sort((a, b) => a.sequence - b.sequence),
    [routeStops],
  );
  const stopByLocation = useMemo(
    () => new Map(orderedStops.map((stop) => [stop.locationId, stop])),
    [orderedStops],
  );
  const ghostStops = useMemo(
    () => ghostRouteStops?.slice().sort((a, b) => a.sequence - b.sequence) ?? [],
    [ghostRouteStops],
  );
  const legByStopIds = useMemo(
    () => new Map((routeLegs ?? []).map((leg) => [`${leg.fromStopId}:${leg.toStopId}`, leg])),
    [routeLegs],
  );

  const partnerViews = useMemo(() => {
    const demands = partners.map((partner) => partner.demandSignals[0]?.desiredQuantityLb ?? 0);
    const minSqrt = Math.sqrt(Math.min(...demands.filter((value) => value > 0), 1));
    const maxSqrt = Math.sqrt(Math.max(...demands, 1));
    return partners.map((partner): PartnerView => {
      const status = state.partnerStatusOverrides[partner.id] ?? partner.status;
      const demandLb = partner.demandSignals[0]?.desiredQuantityLb ?? 0;
      const window = partner.receivingWindows[0];
      const windowPosition: WindowState = window ? windowState(window, nowIso) : { kind: "closed" };
      const spread = Math.max(maxSqrt - minSqrt, 1);
      const routeStop = stopByLocation.get(partner.id);
      return {
        partner,
        status,
        demandLb,
        urgency: partner.demandSignals[0]?.urgency ?? "unknown",
        coverage: demandLb > 0 ? clamp(partner.refrigeratedCapacityAvailableLb / demandLb, 0, 1) : 0,
        diameter: 28 + ((Math.sqrt(demandLb) - minSqrt) / spread) * 16,
        window: windowPosition,
        windowLabel: windowLabelFor(windowPosition, window),
        routeStop,
        ghostOnly: !routeStop && ghostStops.some((stop) => stop.locationId === partner.id),
        excludedReason: activePlan?.excludedDestinations.find(
          (exclusion) => exclusion.destinationId === partner.id,
        )?.reason,
      };
    });
  }, [activePlan, ghostStops, nowIso, state.partnerStatusOverrides, stopByLocation]);

  const dataBounds = useMemo<GeoBounds>(() => {
    const bounds = boundsOf([warehouse.location, ...partners.map((partner) => partner.location)]);
    return bounds ?? { minLatitude: 37.2, maxLatitude: 37.46, minLongitude: -122.08, maxLongitude: -121.74 };
  }, []);
  const dataCenter = useMemo(() => boundsCenter(dataBounds), [dataBounds]);
  // The default view frames the decision story (warehouse + route stops);
  // context agencies stay reachable by panning within the full data bounds.
  const fitBounds = useMemo<GeoBounds>(() => {
    const routeLocations = orderedStops
      .map((stop) => stop.locationId === warehouse.id
        ? warehouse.location
        : partners.find((partner) => partner.id === stop.locationId)?.location)
      .filter((location): location is typeof warehouse.location => Boolean(location));
    const bounds = routeLocations.length >= 2 ? boundsOf(routeLocations) : null;
    return bounds ?? dataBounds;
  }, [dataBounds, orderedStops]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [dragging, setDragging] = useState(false);
  const [basemapFailed, setBasemapFailed] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const anyTileLoaded = useRef(false);
  const lastPinchZoomAt = useRef(0);
  const lastSelectionTrigger = useRef<{ id: string; source: SelectionSource } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCenterWorld: WorldPoint;
    zoom: number;
  } | null>(null);

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedLocationId = controlledSelectedLocationId === undefined
    ? internalSelectedId
    : controlledSelectedLocationId;
  const setSelectedLocationId = useCallback((id: string | null) => {
    if (controlledSelectedLocationId === undefined) setInternalSelectedId(id);
    onSelectedLocationChange?.(id);
  }, [controlledSelectedLocationId, onSelectedLocationChange]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const bounds = canvas.getBoundingClientRect();
      setSize({ width: Math.round(bounds.width), height: Math.round(bounds.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const fitViewport = useCallback((width: number, height: number): Viewport => ({
    center: boundsCenter(fitBounds),
    zoom: fitZoom(fitBounds, width, height),
  }), [fitBounds]);

  // Derive the initial fit once size is known; user pan/zoom takes ownership via setViewport.
  const activeViewport = viewport ?? (size ? fitViewport(size.width, size.height) : null);

  const clampCenter = useCallback((center: LatLng): LatLng => ({
    latitude: clamp(center.latitude, dataBounds.minLatitude - 0.12, dataBounds.maxLatitude + 0.12),
    longitude: clamp(center.longitude, dataBounds.minLongitude - 0.15, dataBounds.maxLongitude + 0.15),
  }), [dataBounds]);

  const applyZoom = useCallback((direction: -1 | 1, anchor?: { x: number; y: number }) => {
    setViewport((current) => {
      const baseline = current ?? (size ? fitViewport(size.width, size.height) : null);
      if (!baseline || !size) return current;
      const zoom = clamp(baseline.zoom + direction, MIN_TILE_ZOOM, MAX_TILE_ZOOM);
      if (zoom === baseline.zoom) return baseline;
      if (!anchor) return { zoom, center: baseline.center };
      const currentWorld = project(baseline.center, baseline.zoom);
      const anchorOffset = { x: anchor.x - size.width / 2, y: anchor.y - size.height / 2 };
      const anchorLatLng = unproject(
        { x: currentWorld.x + anchorOffset.x, y: currentWorld.y + anchorOffset.y },
        baseline.zoom,
      );
      const anchorWorldNext = project(anchorLatLng, zoom);
      const nextCenter = unproject(
        { x: anchorWorldNext.x - anchorOffset.x, y: anchorWorldNext.y - anchorOffset.y },
        zoom,
      );
      return { zoom, center: clampCenter(nextCenter) };
    });
  }, [clampCenter, fitViewport, size]);

  const panByPixels = useCallback((deltaX: number, deltaY: number) => {
    setViewport((current) => {
      const baseline = current ?? (size ? fitViewport(size.width, size.height) : null);
      if (!baseline) return current;
      const world = project(baseline.center, baseline.zoom);
      return {
        zoom: baseline.zoom,
        center: clampCenter(unproject({ x: world.x - deltaX, y: world.y - deltaY }, baseline.zoom)),
      };
    });
  }, [clampCenter, fitViewport, size]);

  const resetView = useCallback(() => {
    if (!size) return;
    setViewport(fitViewport(size.width, size.height));
  }, [fitViewport, size]);

  const selectLocation = useCallback((id: string, source: SelectionSource) => {
    setSelectedLocationId(id);
    lastSelectionTrigger.current = { id, source };
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>("#map-location-detail .map-detail-close")?.focus();
    });
  }, [setSelectedLocationId]);

  const closeDetails = useCallback(() => {
    const trigger = lastSelectionTrigger.current;
    setSelectedLocationId(null);
    if (!trigger) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-testid="map-${trigger.source}-${trigger.id}"]`)?.focus();
    });
  }, [setSelectedLocationId]);

  useEffect(() => {
    if (!selectedLocationId) return;
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDetails();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeDetails, selectedLocationId]);

  const handleMapWheel = useCallback((event: globalThis.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || (Math.abs(event.deltaX) < 1 && Math.abs(event.deltaY) < 1)) return;
    if (event.target instanceof Element && event.target.closest("button, a, [data-map-card], [data-map-chrome]")) return;
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const anchor = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const isPinchZoom = event.ctrlKey || event.metaKey;
    const isCoarseWheel = event.deltaMode !== 0 || Math.abs(event.deltaY) >= 100;

    if (isCoarseWheel) {
      applyZoom(event.deltaY < 0 ? 1 : -1, anchor);
      return;
    }
    if (isPinchZoom) {
      const now = performance.now();
      if (now - lastPinchZoomAt.current < 110) return;
      lastPinchZoomAt.current = now;
      applyZoom(event.deltaY < 0 ? 1 : -1, anchor);
      return;
    }
    panByPixels(-event.deltaX, -event.deltaY);
  }, [applyZoom, panByPixels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleMapWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleMapWheel);
  }, [handleMapWheel]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !activeViewport) return;
    if (event.target instanceof Element && event.target.closest("button, a, [data-map-card], [data-map-chrome]")) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCenterWorld: project(activeViewport.center, activeViewport.zoom),
      zoom: activeViewport.zoom,
    };
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextCenter = unproject({
      x: drag.startCenterWorld.x - (event.clientX - drag.startX),
      y: drag.startCenterWorld.y - (event.clientY - drag.startY),
    }, drag.zoom);
    setViewport({ zoom: drag.zoom, center: clampCenter(nextCenter) });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  function handleMapKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      applyZoom(1);
    } else if (event.key === "-") {
      event.preventDefault();
      applyZoom(-1);
    } else if (event.key === "0") {
      event.preventDefault();
      resetView();
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      if (event.key === "ArrowLeft") panByPixels(72, 0);
      if (event.key === "ArrowRight") panByPixels(-72, 0);
      if (event.key === "ArrowUp") panByPixels(0, 72);
      if (event.key === "ArrowDown") panByPixels(0, -72);
    }
  }

  if (!size || !activeViewport) {
    return (
      <div className={styles.layout}>
        <div ref={canvasRef} className={styles.canvas} aria-hidden="true">
          <div className={styles.loadingBadge}>Preparing decision map…</div>
        </div>
      </div>
    );
  }

  const { width, height } = size;
  const centerWorld = project(activeViewport.center, activeViewport.zoom);
  const origin = project(dataCenter, activeViewport.zoom);
  const relative = (location: LatLng): WorldPoint => {
    const world = project(location, activeViewport.zoom);
    return { x: world.x - origin.x, y: world.y - origin.y };
  };
  const viewportTransform = `translate3d(${(width / 2 + origin.x - centerWorld.x).toFixed(2)}px, ${(height / 2 + origin.y - centerWorld.y).toFixed(2)}px, 0)`;

  const tiles = basemapFailed ? [] : visibleTiles(centerWorld, activeViewport.zoom, width, height);
  const retina = typeof window !== "undefined" && window.devicePixelRatio > 1 ? "@2x" : "";

  const warehousePoint = relative(warehouse.location);
  const warehouseStop = stopByLocation.get(warehouse.id);
  const outboundLb = warehouseStop?.quantityPickupLb ?? 0;
  const partnerStopCount = orderedStops.filter((stop) => stop.locationType === "partner").length;
  const holdRoute = layers.routes && partnerStopCount === 0;

  const pointForStop = (stop: MapRouteStop): WorldPoint | null => {
    if (stop.locationId === warehouse.id) return warehousePoint;
    const partner = partners.find((candidate) => candidate.id === stop.locationId);
    return partner ? relative(partner.location) : null;
  };
  const routePoints = orderedStops
    .map(pointForStop)
    .filter((point): point is WorldPoint => Boolean(point));
  const ghostPoints = ghostStops
    .map(pointForStop)
    .filter((point): point is WorldPoint => Boolean(point));

  const partnerNameById = new Map(partners.map((partner) => [partner.id, partner.name]));
  const removedStops = ghostStops.filter(
    (stop) => stop.locationType === "partner" && !stopByLocation.has(stop.locationId),
  );
  const addedStops = orderedStops.filter(
    (stop) => stop.locationType === "partner" && !ghostStops.some((ghost) => ghost.locationId === stop.locationId),
  );

  const selectedPartner = partnerViews.find((view) => view.partner.id === selectedLocationId);
  const selectedIsWarehouse = selectedLocationId === warehouse.id;
  const selectedIsFleet = selectedLocationId === FLEET_ID;

  const routeStopViews = orderedStops
    .map((stop) => partnerViews.find((view) => view.partner.id === stop.locationId))
    .filter((view): view is PartnerView => Boolean(view));
  const contextViews = partnerViews.filter((view) => !view.routeStop);
  const showContext = contextExpanded || contextViews.some((view) => view.partner.id === selectedLocationId);

  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "available").length;

  return (
    <div className={styles.layout}>
      <div
        ref={canvasRef}
        className={`${styles.canvas} ${dragging ? styles.canvasDragging : ""}`}
        role="group"
        aria-label="Geographic decision map: at-risk inventory, agency readiness, and the committed route"
        aria-describedby="map-zoom-status"
        tabIndex={0}
        data-testid="network-map-canvas"
        data-zoom={activeViewport.zoom}
        onKeyDown={handleMapKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          className={styles.world}
          data-testid="map-viewport"
          style={{ transform: viewportTransform }}
        >
          {basemapFailed ? (
            <div className={styles.fallbackGround} aria-hidden="true" />
          ) : (
            tiles.map((tile) => (
              // eslint-disable-next-line @next/next/no-img-element -- raw 256px tiles from the basemap API; next/image optimization does not apply
              <img
                key={`${tile.z}/${tile.x}/${tile.y}`}
                className={styles.tile}
                src={`https://basemaps.cartocdn.com/light_all/${tile.z}/${tile.x}/${tile.y}${retina}.png`}
                alt=""
                draggable={false}
                decoding="async"
                style={{ transform: `translate3d(${tile.x * 256 - origin.x}px, ${tile.y * 256 - origin.y}px, 0)` }}
                onLoad={(event) => {
                  anyTileLoaded.current = true;
                  event.currentTarget.classList.add(styles.tileLoaded);
                }}
                onError={() => {
                  if (!anyTileLoaded.current) setBasemapFailed(true);
                }}
              />
            ))
          )}

          <svg
            className={styles.overlay}
            viewBox={`${-SVG_HALF} ${-SVG_HALF} ${SVG_HALF * 2} ${SVG_HALF * 2}`}
            aria-hidden="true"
          >
            {layers.routes && ghostPoints.length >= 2 ? (
              <path className={styles.ghostRoute} d={quadraticPath(ghostPoints)} />
            ) : null}
            {layers.routes && routePoints.length >= 2 ? (
              <>
                <path className={styles.routeCasing} d={quadraticPath(routePoints)} />
                <path
                  className={`${styles.route} ${styles[`route_${routeSummary.status}`] ?? ""}`}
                  data-testid="map-route-layer"
                  data-route-status={routeSummary.status}
                  d={quadraticPath(routePoints)}
                  pathLength={
                    routeSummary.status === "candidate" || routeSummary.status === "superseded" || routeSummary.status === "closed"
                      ? undefined
                      : 1
                  }
                />
              </>
            ) : null}
            {layers.routes
              ? orderedStops.map((stop, index) => {
                  const point = routePoints[index];
                  return point ? (
                    <circle
                      key={stop.id}
                      className={styles.routeNode}
                      data-testid={`map-route-node-${stop.locationId}`}
                      cx={point.x}
                      cy={point.y}
                      r={index === 0 ? 5 : 4}
                    />
                  ) : null;
                })
              : null}
          </svg>

          {layers.routes
            ? orderedStops.slice(0, -1).map((stop, index) => {
                const from = routePoints[index];
                const to = routePoints[index + 1];
                const nextStop = orderedStops[index + 1];
                if (!from || !to || !nextStop) return null;
                const leg = legByStopIds.get(`${stop.id}:${nextStop.id}`) ?? routeLegs?.[index];
                if (!leg) return null;
                const midpoint = legMidpoint(from, to);
                return (
                  <span
                    key={`${stop.id}-leg`}
                    className={styles.legLabel}
                    data-testid={`map-leg-label-${index}`}
                    style={{ transform: `translate3d(${midpoint.x}px, ${midpoint.y}px, 0)` }}
                  >
                    {leg.distanceMiles.toFixed(1)} mi · {leg.durationMinutes} min
                  </span>
                );
              })
            : null}

          {layers.capacity ? (
            <div
              className={styles.markerAnchor}
              style={{ transform: `translate3d(${warehousePoint.x}px, ${warehousePoint.y}px, 0)` }}
            >
              <button
                type="button"
                className={`${styles.warehouseMarker} ${selectedIsWarehouse ? styles.markerSelected : ""}`}
                data-testid={`map-marker-${warehouse.id}`}
                aria-label={`Inspect ${warehouse.name}: ${productLot.availableQuantityLb.toLocaleString()} pounds of ${productLot.productName} at risk, deadline ${formatClockDate(productLot.riskDeadline)}`}
                aria-pressed={selectedIsWarehouse}
                aria-expanded={selectedIsWarehouse}
                aria-controls="map-location-detail"
                onClick={() => selectLocation(warehouse.id, "marker")}
              >
                <WarehouseIcon size={18} strokeWidth={2.1} aria-hidden="true" />
              </button>
              <span className={styles.lotChip} aria-hidden="true">
                <Package size={12} aria-hidden="true" />
                <b>{productLot.availableQuantityLb.toLocaleString()} lb</b>&nbsp;{productLot.productName.toLowerCase()}
              </span>
              <span className={styles.deadlineChip} aria-hidden="true">
                <Clock3 size={12} aria-hidden="true" />
                {deadlineRemainingLabel(nowIso)}
              </span>
              {layers.routes && warehouseStop ? (
                <span
                  className={`${styles.markerLabel} ${styles.markerLabelLeft}`}
                  data-testid={`map-route-label-${warehouse.id}`}
                  aria-hidden="true"
                >
                  {warehouse.name}
                </span>
              ) : null}
            </div>
          ) : null}

          {layers.vehicles ? (
            <div
              className={styles.markerAnchor}
              style={{ transform: `translate3d(${warehousePoint.x}px, ${warehousePoint.y}px, 0)` }}
            >
              <button
                type="button"
                className={styles.fleetChip}
                data-testid="map-marker-FLEET"
                aria-label={`Inspect vehicle fleet: ${vehicles.length} vehicles staged at ${warehouse.name}, ${availableVehicles} available`}
                aria-pressed={selectedIsFleet}
                aria-expanded={selectedIsFleet}
                aria-controls="map-location-detail"
                onClick={() => selectLocation(FLEET_ID, "marker")}
              >
                <Truck size={12} aria-hidden="true" />
                {vehicles.length} vehicles · {availableVehicles} available
              </button>
            </div>
          ) : null}

          {layers.demand
            ? partnerViews.map((view) => {
                const point = relative(view.partner.location);
                const selected = selectedLocationId === view.partner.id;
                const onVisibleRoute = layers.routes && Boolean(view.routeStop);
                const labeled = onVisibleRoute || selected;
                const labelOnLeft = view.partner.location.longitude > dataCenter.longitude;
                return (
                  <div
                    key={view.partner.id}
                    className={styles.markerAnchor}
                    style={{ transform: `translate3d(${point.x}px, ${point.y}px, 0)` }}
                  >
                    <button
                      type="button"
                      className={`${styles.partnerMarker} ${statusToneClass(view.status)} ${selected ? styles.markerSelected : ""} ${view.excludedReason || view.status === "unavailable" || view.status === "canceled" ? styles.markerMuted : ""}`}
                      style={{ width: view.diameter, height: view.diameter }}
                      data-testid={`map-marker-${view.partner.id}`}
                      aria-label={`Inspect ${view.partner.name}: ${statusLabel(view.status)}, ${view.demandLb.toLocaleString()} pounds documented demand, ${view.partner.refrigeratedCapacityAvailableLb.toLocaleString()} pounds cold capacity, ${view.windowLabel}`}
                      aria-pressed={selected}
                      aria-expanded={selected}
                      aria-controls="map-location-detail"
                      onClick={() => selectLocation(view.partner.id, "marker")}
                    >
                      <PartnerGlyph view={view} />
                      {onVisibleRoute && view.routeStop ? (
                        <span className={styles.sequenceBadge} aria-hidden="true">{view.routeStop.sequence}</span>
                      ) : null}
                    </button>
                    {labeled ? (
                      <span
                        className={`${styles.markerLabel} ${labelOnLeft ? styles.markerLabelLeft : ""}`}
                        data-testid={onVisibleRoute ? `map-route-label-${view.partner.id}` : undefined}
                        aria-hidden="true"
                      >
                        {view.partner.name}
                      </span>
                    ) : null}
                  </div>
                );
              })
            : null}
        </div>

        <div className={styles.identity} data-map-chrome>
          <MapPin size={13} aria-hidden="true" />
          <span>{basemapFailed ? "Offline schematic · live basemap unavailable" : "Live basemap · seeded operational data"}</span>
          {basemapFailed ? (
            <button type="button" className={styles.retryButton} onClick={() => setBasemapFailed(false)}>
              Retry
            </button>
          ) : null}
        </div>

        <div className={styles.clockBadge} data-map-chrome>
          <Clock3 size={13} aria-hidden="true" />
          <span>Scenario clock · {formatClockDate(nowIso)}</span>
        </div>

        {ghostStops.length ? (
          <div className={styles.diffLegend} data-map-chrome data-testid="map-plan-diff">
            <span className={styles.diffTitle}>Plan changed</span>
            {removedStops.map((stop) => (
              <span key={stop.id} className={styles.diffRemoved}>− {partnerNameById.get(stop.locationId) ?? stop.locationId}</span>
            ))}
            {addedStops.map((stop) => (
              <span key={stop.id} className={styles.diffAdded}>+ {partnerNameById.get(stop.locationId) ?? stop.locationId}</span>
            ))}
            <span className={styles.diffNote}>Dashed line shows the superseded route.</span>
          </div>
        ) : null}

        {holdRoute ? (
          <div className={styles.holdNotice} data-map-chrome data-testid="map-hold-notice">
            No outbound route — this plan holds inventory on site.
          </div>
        ) : null}

        <div className={styles.encodingLegend} data-map-chrome aria-label="Map encoding legend">
          {layers.demand ? (
            <>
              <span><i className={styles.legendSize} aria-hidden="true" />Size = documented demand</span>
              <span><i className={styles.legendFill} aria-hidden="true" />Fill = cold capacity vs demand</span>
              <span><i className={styles.legendRing} aria-hidden="true" />Ring = receiving window left</span>
              <span data-testid="map-legend-demand">
                <i className={`${styles.legendDot} ${styles.toneAvailable}`} aria-hidden="true" />Available
                <i className={`${styles.legendDot} ${styles.toneLimited}`} aria-hidden="true" />Limited
                <i className={`${styles.legendDot} ${styles.toneOut}`} aria-hidden="true" />Out
              </span>
            </>
          ) : null}
          {layers.capacity ? (
            <span data-testid="map-legend-capacity"><i className={`${styles.legendDot} ${styles.legendWarehouse}`} aria-hidden="true" />Warehouse origin</span>
          ) : null}
          {layers.vehicles ? (
            <span data-testid="map-legend-vehicles"><i className={`${styles.legendDot} ${styles.legendFleet}`} aria-hidden="true" />Vehicle fleet</span>
          ) : null}
        </div>

        <div className={styles.zoomControls} data-map-chrome aria-label="Map zoom controls">
          <button type="button" onClick={() => applyZoom(1)} disabled={activeViewport.zoom >= MAX_TILE_ZOOM} aria-label="Zoom in map"><Plus size={17} aria-hidden="true" /></button>
          <output id="map-zoom-status" data-testid="map-zoom-status" aria-label="Map zoom level" aria-live="polite">Z{activeViewport.zoom}</output>
          <button type="button" onClick={() => applyZoom(-1)} disabled={activeViewport.zoom <= MIN_TILE_ZOOM} aria-label="Zoom out map"><Minus size={17} aria-hidden="true" /></button>
          <button type="button" onClick={resetView} aria-label="Reset map view"><LocateFixed size={17} aria-hidden="true" /></button>
        </div>

        {!basemapFailed ? (
          <div className={styles.attribution} data-map-chrome>
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>
          </div>
        ) : null}

        {selectedPartner ? (
          <aside id="map-location-detail" className={styles.detailCard} data-map-card="" aria-label={`${selectedPartner.partner.name} operational details`}>
            <div className={styles.detailHeading}>
              <span className={`${styles.detailIcon} ${statusToneClass(selectedPartner.status)}`}><Building2 size={16} aria-hidden="true" /></span>
              <div>
                <span>{titleCase(selectedPartner.partner.agencyType)} · {selectedPartner.partner.location.city}</span>
                <strong>{selectedPartner.partner.name}</strong>
              </div>
              <button className="icon-button map-detail-close" type="button" onClick={closeDetails} aria-label="Close location details"><X size={16} /></button>
            </div>
            <div className={styles.detailStatusRow}>
              <span className={`plain-status plain-status-${selectedPartner.status === "available" ? "green" : selectedPartner.status === "limited" ? "amber" : "red"}`}>{statusLabel(selectedPartner.status)}</span>
              {selectedPartner.routeStop ? (
                selectedPartner.routeStop.status === "canceled"
                  ? <span className={styles.detailChipWarn}>Stop {selectedPartner.routeStop.sequence} · Canceled during replanning</span>
                  : <span className={styles.detailChipRoute}><CheckCircle2 size={12} aria-hidden="true" />Stop {selectedPartner.routeStop.sequence} · On current route</span>
              ) : selectedPartner.ghostOnly ? (
                <span className={styles.detailChipWarn}>Removed from the replanned route</span>
              ) : (
                <span className={styles.detailChip}>Context agency</span>
              )}
            </div>
            <div className={styles.detailFacts}>
              {selectedPartner.routeStop && selectedPartner.routeStop.status !== "canceled" ? (
                <div><span>Planned delivery</span><strong>{Math.max(selectedPartner.routeStop.quantityPickupLb, selectedPartner.routeStop.quantityDropoffLb).toLocaleString()} lb · Refrigerated</strong></div>
              ) : null}
              <div><span>Documented demand</span><strong>{selectedPartner.demandLb.toLocaleString()} lb · {titleCase(selectedPartner.urgency)}</strong></div>
              <div><span>Compatible cold capacity</span><strong>{selectedPartner.partner.refrigeratedCapacityAvailableLb.toLocaleString()} lb available · covers {Math.round(selectedPartner.coverage * 100)}% of demand</strong></div>
              <div>
                <span>Receiving window</span>
                <strong>
                  {selectedPartner.partner.receivingWindows[0]
                    ? `${formatTime(selectedPartner.partner.receivingWindows[0].start)} – ${formatTime(selectedPartner.partner.receivingWindows[0].end)} · `
                    : null}
                  {selectedPartner.windowLabel} <small>(scenario clock)</small>
                </strong>
              </div>
              <div><span>Service gap</span><strong>{selectedPartner.partner.recentServiceGap}/100 documented</strong></div>
              {(() => {
                const acceptance = selectedPartner.partner.acceptanceHistory.find((history) => history.category === productLot.category);
                return (
                  <div>
                    <span>Historical {productLot.category} acceptance</span>
                    <strong>{acceptance ? `${acceptance.acceptanceRatePct}% full acceptance · ${acceptance.acceptedCount} accepted / ${acceptance.refusedCount} refused / ${acceptance.shortReceiptCount} short · n=${acceptance.sampleSize}` : "Category history unknown"}</strong>
                  </div>
                );
              })()}
              {selectedPartner.excludedReason ? (
                <div><span>Excluded from this plan</span><strong>{selectedPartner.excludedReason}</strong></div>
              ) : null}
            </div>
            {activePlan ? <ScoreBreakdown plan={activePlan} destinationId={selectedPartner.partner.id} /> : null}
            <Link className={`panel-link ${styles.detailLink}`} href={`/partners/${selectedPartner.partner.id}`}>Open partner profile <MapPin size={13} aria-hidden="true" /></Link>
          </aside>
        ) : selectedIsWarehouse ? (
          <aside id="map-location-detail" className={styles.detailCard} data-map-card="" aria-label={`${warehouse.name} operational details`}>
            <div className={styles.detailHeading}>
              <span className={`${styles.detailIcon} ${styles.toneWarehouse}`}><WarehouseIcon size={16} aria-hidden="true" /></span>
              <div>
                <span>Warehouse · {warehouse.location.city}</span>
                <strong>{warehouse.name}</strong>
              </div>
              <button className="icon-button map-detail-close" type="button" onClick={closeDetails} aria-label="Close location details"><X size={16} /></button>
            </div>
            <div className={styles.detailFacts}>
              <div><span>At-risk inventory</span><strong>{productLot.availableQuantityLb.toLocaleString()} lb {productLot.productName} · {titleCase(productLot.riskLevel)} risk</strong></div>
              <div><span>Risk deadline</span><strong>{formatClockDate(productLot.riskDeadline)} · {deadlineRemainingLabel(nowIso)} <small>(scenario clock)</small></strong></div>
              {warehouseStop ? <div><span>Planned outbound load</span><strong>{outboundLb.toLocaleString()} lb · Refrigerated</strong></div> : null}
              <div><span>Long-term cold headroom</span><strong>{(warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb).toLocaleString()} lb available</strong></div>
              <div><span>Short-dwell cold staging</span><strong>{warehouse.refrigeratedStagingCapacityAvailableLb.toLocaleString()} lb available</strong></div>
              <div><span>Dock window</span><strong>{formatTime(warehouse.dockWindows[0].start)} – {formatTime(warehouse.dockWindows[0].end)}</strong></div>
            </div>
          </aside>
        ) : selectedIsFleet ? (
          <aside id="map-location-detail" className={styles.detailCard} data-map-card="" aria-label="Vehicle fleet details">
            <div className={styles.detailHeading}>
              <span className={`${styles.detailIcon} ${styles.toneFleet}`}><Truck size={16} aria-hidden="true" /></span>
              <div>
                <span>Fleet · staged at {warehouse.name}</span>
                <strong>{vehicles.length} vehicles · {availableVehicles} available</strong>
              </div>
              <button className="icon-button map-detail-close" type="button" onClick={closeDetails} aria-label="Close location details"><X size={16} /></button>
            </div>
            <div className={styles.detailFacts}>
              {vehicles.map((vehicle) => (
                <div key={vehicle.id}>
                  <span>{vehicle.name} · {titleCase(vehicle.status)}</span>
                  <strong>{vehicle.capacityLb.toLocaleString()} lb payload · {vehicle.temperatureCapability.map(titleCase).join(" + ")}</strong>
                </div>
              ))}
            </div>
            <p className={styles.detailNote}>All vehicles are seeded at the warehouse; no live telemetry exists in this prototype.</p>
          </aside>
        ) : null}

        <div className={styles.canvasFooter} data-map-chrome>
          <span>Select a marker for evidence · drag to pan · scroll or pinch to zoom</span>
        </div>
      </div>

      <aside className={styles.locationList} aria-label="Synchronized map location list">
        <div className={styles.listHeading}>
          <div>
            <span className={styles.eyebrow}>On route</span>
            <strong>{layers.routes ? `${orderedStops.length} stops` : "Routes layer hidden"}</strong>
          </div>
          <span className={styles.listHint}>Select for details</span>
        </div>
        <div className={styles.routeSummaryRow}>
          <span className={`${styles.routeSwatch} ${styles[`swatch_${routeSummary.status}`] ?? ""}`} aria-hidden="true" />
          <span>
            <strong>{routeSummary.label}</strong>
            <small>{routeSummary.miles.toFixed(1)} mi · {routeSummary.stops} stops · {routeSummary.loadLb.toLocaleString()} lb</small>
            <small className={styles.routeSummaryNote}>{routeSummaryNotes[routeSummary.status]}</small>
          </span>
        </div>

        <div className="map-location-section">
          {layers.capacity && warehouseStop ? (
            <button
              type="button"
              className={`${styles.listRow} ${selectedIsWarehouse ? styles.listRowSelected : ""}`}
              data-testid={`map-location-${warehouse.id}`}
              aria-pressed={selectedIsWarehouse}
              aria-controls="map-location-detail"
              onClick={() => selectLocation(warehouse.id, "location")}
            >
              <span className={`${styles.listIcon} ${styles.toneWarehouse}`}><WarehouseIcon size={13} aria-hidden="true" /></span>
              <span className={styles.listSequence}>{warehouseStop.sequence}</span>
              <span className={styles.listCopy}><strong>{warehouse.name}</strong><small>{warehouse.location.city} · Outbound origin</small></span>
              <span className={styles.listSignal}><b>{outboundLb.toLocaleString()} lb</b><small>outbound load</small></span>
            </button>
          ) : null}

          {layers.demand && layers.routes
            ? routeStopViews.map((view) => (
                <LocationRow key={view.partner.id} view={view} selected={selectedLocationId === view.partner.id} onSelect={selectLocation} />
              ))
            : null}
        </div>

        {layers.demand ? (
          <div className={styles.contextSection}>
            <button
              className={styles.contextToggle}
              type="button"
              aria-expanded={showContext}
              aria-controls="map-nearby-context"
              onClick={() => setContextExpanded((expanded) => !expanded)}
            >
              <span>Other agencies · {contextViews.length}</span>
              {showContext ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
            </button>
            {showContext ? (
              <div id="map-nearby-context" className={styles.contextRows}>
                {contextViews.map((view) => (
                  <LocationRow key={view.partner.id} view={view} selected={selectedLocationId === view.partner.id} onSelect={selectLocation} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.syncNote}><CheckCircle2 size={13} aria-hidden="true" />Selection is synchronized with the map. Every value traces to seeded records.</div>
      </aside>
    </div>
  );
}

function LocationRow({
  view,
  selected,
  onSelect,
}: {
  view: PartnerView;
  selected: boolean;
  onSelect: (id: string, source: SelectionSource) => void;
}) {
  const plannedLb = view.routeStop && view.routeStop.status !== "canceled"
    ? Math.max(view.routeStop.quantityPickupLb, view.routeStop.quantityDropoffLb)
    : undefined;
  return (
    <button
      type="button"
      className={`${styles.listRow} ${selected ? styles.listRowSelected : ""}`}
      data-testid={`map-location-${view.partner.id}`}
      aria-pressed={selected}
      aria-controls="map-location-detail"
      onClick={() => onSelect(view.partner.id, "location")}
    >
      <span className={`${styles.listIcon} ${statusToneClass(view.status)}`}><Building2 size={13} aria-hidden="true" /></span>
      {view.routeStop ? <span className={styles.listSequence}>{view.routeStop.sequence}</span> : null}
      <span className={styles.listCopy}>
        <strong>{view.partner.name}</strong>
        <small>{view.partner.location.city} · {view.routeStop?.status === "canceled" ? "Canceled stop" : statusLabel(view.status)}</small>
      </span>
      <span className={styles.listSignal}>
        {plannedLb !== undefined ? (
          <>
            <b>{plannedLb.toLocaleString()} lb</b>
            <small>planned delivery</small>
            {view.demandLb > 0 ? <small>{view.demandLb.toLocaleString()} lb requested</small> : null}
          </>
        ) : (
          <><b>{view.demandLb.toLocaleString()} lb</b><small>{titleCase(view.urgency)} need</small></>
        )}
        <small className={styles.listWindow}>{view.windowLabel}</small>
      </span>
    </button>
  );
}
