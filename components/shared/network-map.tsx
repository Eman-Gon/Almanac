"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Snowflake,
  Truck,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { partners, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import type { Mission } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";

export type MapVariant = "initial" | "recovery";
export type MapLayers = {
  routes: boolean;
  demand: boolean;
  capacity: boolean;
  vehicles: boolean;
};

export type MapRouteSummary = {
  label: string;
  miles: number;
  stops: number;
  loadLb: number;
  status: "candidate" | "approved" | "disrupted" | "replanned" | Extract<Mission["status"], "superseded" | "delivered" | "closed">;
};

const routeSummaryNotes: Record<MapRouteSummary["status"], string> = {
  candidate: "Candidate route shown for decision context.",
  approved: "Human-approved route currently in execution.",
  disrupted: "A canceled stop requires human-approved replanning.",
  replanned: "Human-approved replacement route is active.",
  superseded: "Original route superseded by the human-approved replacement mission.",
  delivered: "Delivered route retained for impact and audit context.",
  closed: "Closed mission retained for audit context.",
};

export type MapRouteStop = Mission["stops"][number];

const defaultLayers: MapLayers = {
  routes: true,
  demand: true,
  capacity: true,
  vehicles: true,
};

const mapBounds = {
  minLatitude: 37.2,
  maxLatitude: 37.46,
  minLongitude: -122.08,
  maxLongitude: -121.74,
};

const MAP_ZOOM_LEVELS = [1, 1.25, 1.5, 1.75] as const;
const DEFAULT_VIEWPORT = { zoom: 1, panX: 0, panY: 0 };
const ROUTE_FOCUS_SCREEN = { x: 50, y: 58 };

type MapLocationKind = "warehouse" | "partner" | "vehicle";
type StatusTone = "green" | "amber" | "red" | "purple" | "blue" | "slate";

type MapLocation = {
  id: string;
  name: string;
  city: string;
  kind: MapLocationKind;
  icon: LucideIcon;
  tone: StatusTone;
  status: string;
  statusTone: StatusTone;
  point: { x: number; y: number };
  routeStop: boolean;
  href?: string;
  quantityLb?: number;
  demand?: {
    quantityLb: number;
    urgency: string;
    serviceGap: number;
  };
  capacity?: {
    availableLb: number;
    label: string;
    coveragePct?: number;
  };
  receivingWindow?: string;
  acceptanceEvidence?: string;
  note: string;
};

type SelectionSource = "marker" | "location";

type MapViewport = typeof DEFAULT_VIEWPORT;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function maximumPan(zoom: number): number {
  if (zoom <= 1) return 0;
  return Math.min(32, (zoom - 1) * 42 + 8);
}

function clampViewport(viewport: MapViewport): MapViewport {
  const maxPan = maximumPan(viewport.zoom);
  return {
    zoom: viewport.zoom,
    panX: clamp(viewport.panX, -maxPan, maxPan),
    panY: clamp(viewport.panY, -maxPan, maxPan),
  };
}

function projectPoint(point: { x: number; y: number }, viewport: MapViewport): { x: number; y: number } {
  return {
    x: 50 + (point.x - 50) * viewport.zoom + viewport.panX,
    y: 50 + (point.y - 50) * viewport.zoom + viewport.panY,
  };
}

function pointForLocation(location: { latitude: number; longitude: number }): { x: number; y: number } {
  const x = ((location.longitude - mapBounds.minLongitude) / (mapBounds.maxLongitude - mapBounds.minLongitude)) * 100;
  const y = ((mapBounds.maxLatitude - location.latitude) / (mapBounds.maxLatitude - mapBounds.minLatitude)) * 100;
  return { x: clamp(x, 7, 93), y: clamp(y, 10, 90) };
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatWindow(window: { start: string; end: string }): string {
  return `${formatTime(window.start)} – ${formatTime(window.end)}`;
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string): StatusTone {
  if (status === "available") return "green";
  if (status === "limited") return "amber";
  return "red";
}

function statusLabel(status: string): string {
  if (status === "canceled") return "Canceled";
  if (status === "unavailable") return "Unavailable";
  if (status === "limited") return "Limited capacity";
  return "Available";
}

function locationKindLabel(kind: MapLocationKind): string {
  if (kind === "warehouse") return "Warehouse";
  if (kind === "vehicle") return "Vehicle";
  return "Partner agency";
}

function markerClass(location: MapLocation): string {
  return `marker-${location.tone}`;
}

function buildLocationData(
  variant: MapVariant,
  partnerStatusOverrides: Record<string, string>,
  routeStops?: MapRouteStop[],
  routeLocationIds?: string[],
): {
  locations: MapLocation[];
  routeIds: string[];
} {
  const routeIds = routeStops?.length
    ? routeStops.slice().sort((a, b) => a.sequence - b.sequence).map((stop) => stop.locationId)
    : routeLocationIds?.length
    ? routeLocationIds
    : variant === "recovery"
      ? [warehouse.id, "PAR-001", "PAR-004", "PAR-003"]
      : [warehouse.id, "PAR-001", "PAR-002", "PAR-003"];

  const warehouseLocation: MapLocation = {
    id: warehouse.id,
    name: warehouse.name,
    city: warehouse.location.city,
    kind: "warehouse",
    icon: Warehouse,
    tone: "purple",
    status: "Outbound origin",
    statusTone: "purple",
    point: pointForLocation(warehouse.location),
    routeStop: routeIds.includes(warehouse.id),
    quantityLb: productLot.availableQuantityLb,
    capacity: {
      availableLb: warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb,
      label: "Long-term cold storage headroom",
      coveragePct: ((warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb) / warehouse.refrigeratedCapacityLb) * 100,
    },
    receivingWindow: formatWindow(warehouse.dockWindows[0]),
    note: `${productLot.availableQuantityLb.toLocaleString()} lb available inventory · ${warehouse.refrigeratedStagingCapacityAvailableLb.toLocaleString()} lb short-dwell staging available`,
  };

  const partnerLocations = partners.map((partner): MapLocation => {
    const demand = partner.demandSignals[0];
    const status = partnerStatusOverrides[partner.id] ?? partner.status;
    const availableCapacity = partner.refrigeratedCapacityAvailableLb;
    const acceptance = partner.acceptanceHistory.find((history) => history.category === productLot.category);
    return {
      id: partner.id,
      name: partner.name,
      city: partner.location.city,
      kind: "partner",
      icon: Building2,
      tone: statusTone(status),
      status: statusLabel(status),
      statusTone: statusTone(status),
      point: pointForLocation(partner.location),
      routeStop: routeIds.includes(partner.id),
      href: `/partners/${partner.id}`,
      demand: {
        quantityLb: demand?.desiredQuantityLb ?? 0,
        urgency: demand?.urgency ?? "unknown",
        serviceGap: partner.recentServiceGap,
      },
      capacity: {
        availableLb: availableCapacity,
        label: "Compatible cold capacity",
        coveragePct: demand?.desiredQuantityLb
          ? Math.min(100, (availableCapacity / demand.desiredQuantityLb) * 100)
          : 0,
      },
      receivingWindow: partner.receivingWindows[0]
        ? formatWindow(partner.receivingWindows[0])
        : "Receiving window unknown",
      acceptanceEvidence: acceptance
        ? `${acceptance.acceptanceRatePct}% full acceptance · ${acceptance.acceptedCount} accepted / ${acceptance.refusedCount} refused / ${acceptance.shortReceiptCount} short · n=${acceptance.sampleSize}`
        : "Category history unknown",
      note: `${titleCase(partner.agencyType)} · service gap ${partner.recentServiceGap}/100`,
    };
  });

  const vehicleLocations = vehicles.map((vehicle, index): MapLocation => ({
    id: vehicle.id,
    name: vehicle.name,
    city: vehicle.currentLocation.city,
    kind: "vehicle",
    icon: Truck,
    tone: "slate",
    status: titleCase(vehicle.status),
    statusTone: vehicle.status === "assigned" ? "blue" : "green",
    point: pointForLocation({
      latitude: vehicle.currentLocation.latitude + 0.008 + index * 0.006,
      longitude: vehicle.currentLocation.longitude + 0.01 + index * 0.008,
    }),
    routeStop: false,
    capacity: {
      availableLb: vehicle.capacityLb,
      label: "Payload capacity",
      coveragePct: 100,
    },
    note: `${vehicle.temperatureCapability.map(titleCase).join(" + ")} compatible`,
  }));

  return {
    locations: [warehouseLocation, ...partnerLocations, ...vehicleLocations],
    routeIds,
  };
}

function routePoints(locations: MapLocation[], routeIds: string[]): string {
  return routeIds
    .map((id) => locations.find((location) => location.id === id)?.point)
    .filter((point): point is { x: number; y: number } => Boolean(point))
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function compactLocations(locations: MapLocation[], routeIds: string[], layers: MapLayers): MapLocation[] {
  const routeLocations = routeIds
    .map((id) => locations.find((location) => location.id === id))
    .filter((location): location is MapLocation => Boolean(location));
  const vehicle = layers.vehicles ? locations.find((location) => location.kind === "vehicle") : undefined;
  return [...routeLocations, ...(vehicle ? [vehicle] : [])].filter((location) => {
    if (location.kind === "partner") return layers.demand;
    if (location.kind === "warehouse") return layers.capacity;
    return true;
  });
}

function LocationMarker({
  location,
  interactive,
  selected,
  routeVisible,
  routeStop,
  viewport,
  onSelect,
}: {
  location: MapLocation;
  interactive: boolean;
  selected: boolean;
  routeVisible: boolean;
  routeStop?: MapRouteStop;
  viewport: MapViewport;
  onSelect: (id: string, source: SelectionSource) => void;
}) {
  const Icon = location.icon;
  const className = `map-marker ${markerClass(location)} ${routeVisible && location.routeStop ? "map-marker-route" : ""} ${selected ? "map-marker-selected" : ""}`;

  if (!interactive) {
    return (
      <span
        className={className}
        style={{ left: `${location.point.x}%`, top: `${location.point.y}%` }}
        aria-label={`${location.name}: ${location.status}`}
      >
        <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
      </span>
    );
  }

  const projectedPoint = projectPoint(location.point, viewport);
  const showLabel = (routeVisible && routeStop) || selected;
  const labelPoint = showLabel
    ? { x: clamp(projectedPoint.x, 2, 98), y: clamp(projectedPoint.y, 2, 98) }
    : projectedPoint;
  // Long route names need more room than the marker icon. Flip labels before
  // the visual midpoint of the right-hand third so they stay inside stacked
  // and tablet-width map canvases, including after zoom projection.
  const labelOnLeft = labelPoint.x > 55;
  const labelBelow = labelPoint.y < 15;
  const labelAbove = labelPoint.y > 85;
  const labelPlacement = labelBelow ? "map-marker-label-below" : labelAbove ? "map-marker-label-above" : "";

  return (
    <>
      <div
        className={`map-marker-wrap ${showLabel ? "map-marker-wrap-labeled" : ""}`}
        style={{ left: `${projectedPoint.x}%`, top: `${projectedPoint.y}%` }}
      >
        <button
          className={`map-marker-control ${markerClass(location)} ${routeVisible && location.routeStop ? "map-marker-route" : ""} ${selected ? "map-marker-selected" : ""}`}
          type="button"
          data-testid={`map-marker-${location.id}`}
          aria-label={`Inspect ${location.name}, ${location.status}`}
          aria-pressed={selected}
          aria-expanded={selected}
          aria-controls="map-location-detail"
          title={`${location.name} · ${location.status}`}
          onClick={() => onSelect(location.id, "marker")}
        >
          <span className="map-marker-pin"><Icon size={16} strokeWidth={2.2} aria-hidden="true" /></span>
          {routeStop && routeVisible ? <span className="map-marker-sequence-badge" aria-hidden="true">{routeStop.sequence}</span> : null}
        </button>
      </div>
      {showLabel ? (
        <span className="map-marker-label-anchor" style={{ left: `${labelPoint.x}%`, top: `${labelPoint.y}%` }}>
          <span
            className={`map-marker-label ${labelOnLeft ? "map-marker-label-left" : ""} ${labelPlacement} ${selected ? "map-marker-label-selected" : ""}`}
            data-testid={routeStop ? `map-route-label-${location.id}` : undefined}
            aria-hidden="true"
          >
            {routeStop ? <b>{routeStop.sequence}</b> : null}
            <span>{location.name}</span>
          </span>
        </span>
      ) : null}
    </>
  );
}

function MapDetailCard({
  location,
  routeStop,
  routeVisible,
  onClose,
}: {
  location: MapLocation;
  routeStop?: MapRouteStop;
  routeVisible: boolean;
  onClose: () => void;
}) {
  const Icon = location.icon;
  const plannedQuantityLb = routeStop
    ? Math.max(routeStop.quantityPickupLb, routeStop.quantityDropoffLb)
    : undefined;
  return (
    <aside id="map-location-detail" className="map-detail-card" aria-label={`${location.name} operational details`}>
      <div className="map-detail-card-heading">
        <div className={`map-detail-icon ${markerClass(location)}`}><Icon size={17} aria-hidden="true" /></div>
        <div>
          <span>{locationKindLabel(location.kind)} · {location.city}</span>
          <strong>{location.name}</strong>
        </div>
        <button className="icon-button map-detail-close" type="button" onClick={onClose} aria-label="Close location details"><X size={16} /></button>
      </div>
      <div className="map-detail-status-row">
        <span className={`plain-status plain-status-${location.statusTone === "slate" ? "blue" : location.statusTone}`}>{location.status}</span>
        {location.routeStop && routeVisible ? (
          routeStop?.status === "canceled"
            ? <span className="map-context-chip">Stop {routeStop.sequence} · Canceled during replanning</span>
            : <span className="map-route-chip"><CheckCircle2 size={12} aria-hidden="true" />{routeStop ? `Stop ${routeStop.sequence} · ` : ""}On current route</span>
        ) : location.routeStop ? <span className="map-context-chip">Route layer hidden</span> : <span className="map-context-chip">Context location</span>}
      </div>
      <div className="map-detail-facts">
        {plannedQuantityLb !== undefined ? <div><span>{location.kind === "warehouse" ? "Planned outbound load" : "Planned delivery"}</span><strong>{plannedQuantityLb.toLocaleString()} lb · Refrigerated</strong></div> : location.quantityLb ? <div><span>Available inventory</span><strong>{location.quantityLb.toLocaleString()} lb · Refrigerated</strong></div> : null}
        {location.demand ? <div><span>Demand</span><strong>{location.demand.quantityLb.toLocaleString()} lb · {titleCase(location.demand.urgency)}</strong></div> : null}
        {location.capacity ? <div><span>{location.capacity.label}</span><strong>{location.capacity.availableLb.toLocaleString()} lb available</strong></div> : null}
        {location.receivingWindow ? <div><span>{location.kind === "warehouse" ? "Warehouse departure window" : "Receiving window"}</span><strong>{location.receivingWindow}</strong></div> : null}
        {location.acceptanceEvidence ? <div><span>Historical produce acceptance</span><strong>{location.acceptanceEvidence}</strong></div> : null}
      </div>
      {location.capacity?.coveragePct !== undefined ? (
        <div className="map-capacity-meter" aria-label={`${location.capacity.label}: ${Math.round(location.capacity.coveragePct)} percent coverage`}>
          <div><span>{location.kind === "partner" ? "Coverage vs requested" : "Available share"}</span><strong>{Math.round(location.capacity.coveragePct)}%</strong></div>
          <span><i style={{ width: `${Math.min(100, location.capacity.coveragePct)}%` }} /></span>
        </div>
      ) : null}
      <p className="map-detail-note">{location.note}</p>
      {location.href ? <Link className="panel-link map-detail-link" href={location.href}>Open partner profile <MapPin size={13} aria-hidden="true" /></Link> : null}
    </aside>
  );
}

function CompactLocationList({ locations, routeSummary }: { locations: MapLocation[]; routeSummary?: MapRouteSummary }) {
  return (
    <div className="map-location-list" aria-label="Synchronized route locations">
      <div className="map-list-title">Route locations</div>
      {routeSummary ? <div className="map-list-route-note"><RouteSummaryLine routeSummary={routeSummary} /></div> : null}
      {locations.map((location, index) => {
        const Icon = location.icon;
        const content = <><span className={`legend-dot ${location.tone}`}><Icon size={11} aria-hidden="true" /></span>{location.routeStop ? <span className="map-compact-sequence">{index + 1}</span> : null}<span><strong>{location.name}</strong><small>{location.status}</small></span></>;
        return location.href ? <Link key={location.id} href={location.href}>{content}</Link> : <span key={location.id}>{content}</span>;
      })}
      <div className="map-sync-note">Warehouse origin → partner deliveries</div>
    </div>
  );
}

function RouteSummaryLine({ routeSummary }: { routeSummary: MapRouteSummary }) {
  return (
    <>
      <span className={`route-line-swatch route-line-${routeSummary.status}`} aria-hidden="true" />
      <span><strong>{routeSummary.label}</strong><small>{routeSummary.miles.toFixed(1)} mi · {routeSummary.stops} stops · {routeSummary.loadLb.toLocaleString()} lb</small></span>
    </>
  );
}

function InteractiveLocationList({
  locations,
  routeSummary,
  routeStops,
  layers,
  routesVisible,
  selectedLocationId,
  onSelect,
}: {
  locations: MapLocation[];
  routeSummary?: MapRouteSummary;
  routeStops: MapRouteStop[];
  layers: MapLayers;
  routesVisible: boolean;
  selectedLocationId: string | null;
  onSelect: (id: string, source: SelectionSource) => void;
}) {
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const routeLocations = routesVisible
    ? routeStops
      .map((stop) => locationById.get(stop.locationId))
      .filter((location): location is MapLocation => Boolean(location))
    : [];
  const contextLocations = routesVisible ? locations.filter((location) => !location.routeStop) : locations;
  const hiddenRouteStopCount = routesVisible ? routeStops.length - routeLocations.length : 0;
  const [contextExpanded, setContextExpanded] = useState(false);
  const selectedContextLocation = selectedLocationId
    ? contextLocations.some((location) => location.id === selectedLocationId)
    : false;
  const showContext = contextExpanded || selectedContextLocation;
  const routeStopByLocation = new Map(routeStops.map((stop) => [stop.locationId, stop]));

  return (
    <aside className="map-location-list map-location-list-interactive" aria-label="Synchronized map location list">
      <div className="map-list-heading">
        <div>
          <span className="map-eyebrow">On route</span>
          <strong>
            {routesVisible
              ? hiddenRouteStopCount > 0
                ? `${routeLocations.length} of ${routeStops.length} stops visible`
                : `${routeLocations.length} stops`
              : `${contextLocations.length} visible locations`}
          </strong>
        </div>
        <span className="map-list-hint">Select for details</span>
      </div>
      {routeSummary ? routesVisible ? <div className="map-route-summary"><RouteSummaryLine routeSummary={routeSummary} /><span className="map-route-summary-note">{routeSummaryNotes[routeSummary.status]}</span></div> : <div className="map-layer-hidden-note"><RouteSummaryLine routeSummary={routeSummary} /><span>Routes layer hidden · location context remains available.</span></div> : null}
      <div className="map-legend" aria-label="Map legend">
        {layers.capacity ? <span data-testid="map-legend-capacity"><i className="legend-swatch legend-purple" />Warehouse</span> : null}
        {layers.demand ? <span data-testid="map-legend-demand"><i className="legend-swatch legend-green" />Available <i className="legend-swatch legend-amber" />Limited <i className="legend-swatch legend-red" />Unavailable</span> : null}
        {layers.vehicles ? <span data-testid="map-legend-vehicles"><i className="legend-swatch legend-slate" />Vehicle</span> : null}
      </div>
      <div className="map-location-section">
        <span className="map-section-label">{routesVisible ? `On route · ${routeLocations.length}` : `Visible locations · ${contextLocations.length}`}</span>
        {routeLocations.map((location, index) => <LocationListButton key={location.id} location={location} routeStop={routeStopByLocation.get(location.id)} sequence={routeStopByLocation.get(location.id)?.sequence ?? index + 1} selected={selectedLocationId === location.id} onSelect={onSelect} />)}
        {!routesVisible ? contextLocations.map((location) => <LocationListButton key={location.id} location={location} selected={selectedLocationId === location.id} onSelect={onSelect} />) : null}
      </div>
      {routesVisible && contextLocations.length ? (
        <div className="map-location-section map-context-section">
          <button
            className="map-context-toggle"
            type="button"
            aria-expanded={showContext}
            aria-controls="map-nearby-context"
            onClick={() => setContextExpanded((expanded) => !expanded)}
          >
            <span>Nearby context · {contextLocations.length}</span>
            {showContext ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
          </button>
          {showContext ? (
            <div id="map-nearby-context" className="map-context-rows">
              {contextLocations.map((location) => <LocationListButton key={location.id} location={location} selected={selectedLocationId === location.id} onSelect={onSelect} />)}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="map-sync-note"><CheckCircle2 size={13} aria-hidden="true" />Selection is synchronized with the schematic map</div>
    </aside>
  );
}

function LocationListButton({
  location,
  routeStop,
  sequence,
  selected,
  onSelect,
}: {
  location: MapLocation;
  routeStop?: MapRouteStop;
  sequence?: number;
  selected: boolean;
  onSelect: (id: string, source: SelectionSource) => void;
}) {
  const Icon = location.icon;
  const plannedQuantityLb = routeStop
    ? Math.max(routeStop.quantityPickupLb, routeStop.quantityDropoffLb)
    : undefined;
  return (
    <button
      className={`map-location-card ${sequence ? "" : "map-location-card-no-sequence"} ${selected ? "map-location-card-selected" : ""}`}
      type="button"
      data-testid={`map-location-${location.id}`}
      aria-pressed={selected}
      aria-expanded={selected}
      aria-controls="map-location-detail"
      onClick={() => onSelect(location.id, "location")}
    >
      <span className={`map-location-card-icon ${markerClass(location)}`}><Icon size={14} aria-hidden="true" /></span>
      {sequence ? <span className="map-location-sequence">{sequence}</span> : null}
      <span className="map-location-card-copy"><strong>{location.name}</strong><small>{location.city} · {location.status}</small></span>
      <span className="map-location-card-signal">
        {plannedQuantityLb !== undefined ? (
          <>
            <b>{plannedQuantityLb.toLocaleString()} lb</b>
            <small>{location.kind === "warehouse" ? "outbound load" : "planned delivery"}</small>
            {location.demand ? <small className="map-location-card-requested">{location.demand.quantityLb.toLocaleString()} lb requested</small> : null}
          </>
        ) : location.demand ? (
          <>
            <b>{location.demand.quantityLb.toLocaleString()} lb</b>
            <small>{titleCase(location.demand.urgency)} need</small>
          </>
        ) : location.capacity ? (
          <>
            <b>{location.capacity.availableLb.toLocaleString()} lb</b>
            <small>{location.kind === "vehicle" ? "payload" : "cold headroom"}</small>
          </>
        ) : location.quantityLb ? (
          <>
            <b>{location.quantityLb.toLocaleString()} lb</b>
            <small>available inventory</small>
          </>
        ) : (
          <>
            <b>Window</b>
            <small>{location.receivingWindow ?? "Window unknown"}</small>
          </>
        )}
      </span>
    </button>
  );
}

export function NetworkMap({
  variant = "initial",
  showList = true,
  layers = defaultLayers,
  interactive = false,
  routeSummary,
  routeStops,
  routeLocationIds,
  selectedLocationId: controlledSelectedLocationId,
  onSelectedLocationChange,
}: {
  variant?: MapVariant;
  showList?: boolean;
  layers?: MapLayers;
  interactive?: boolean;
  routeSummary?: MapRouteSummary;
  routeStops?: MapRouteStop[];
  routeLocationIds?: string[];
  selectedLocationId?: string | null;
  onSelectedLocationChange?: (id: string | null) => void;
}) {
  const { state } = useDemoState();
  const { locations, routeIds } = useMemo(
    () => buildLocationData(variant, state.partnerStatusOverrides, routeStops, routeLocationIds),
    [routeLocationIds, routeStops, state.partnerStatusOverrides, variant],
  );
  const orderedRouteStops = useMemo(
    () => routeStops?.slice().sort((a, b) => a.sequence - b.sequence) ?? [],
    [routeStops],
  );
  const routeStopByLocation = useMemo(
    () => new Map(orderedRouteStops.map((stop) => [stop.locationId, stop])),
    [orderedRouteStops],
  );
  const visibleLocations = locations.filter((location) => {
    if (location.kind === "partner") return layers.demand;
    if (location.kind === "warehouse") return layers.capacity;
    if (location.kind === "vehicle") return layers.vehicles;
    return true;
  });
  const listLocations = interactive ? visibleLocations : compactLocations(locations, routeIds, layers);
  const markerLocations = interactive ? visibleLocations : listLocations;
  const [internalSelectedLocationId, setInternalSelectedLocationId] = useState<string | null>(null);
  const selectedLocationId = controlledSelectedLocationId === undefined
    ? internalSelectedLocationId
    : controlledSelectedLocationId;
  const setSelectedLocationId = useCallback((id: string | null) => {
    if (controlledSelectedLocationId === undefined) {
      setInternalSelectedLocationId(id);
    }
    onSelectedLocationChange?.(id);
  }, [controlledSelectedLocationId, onSelectedLocationChange]);
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const lastPinchZoomAt = useRef(0);
  const lastSelectionTrigger = useRef<{ id: string; source: SelectionSource } | null>(null);
  const selectedLocation = interactive
    ? visibleLocations.find((location) => location.id === selectedLocationId)
    : undefined;
  const route = routePoints(locations, routeIds);
  const routeFocusPoint = useMemo(() => {
    const points = routeIds
      .map((id) => locations.find((location) => location.id === id)?.point)
      .filter((point): point is { x: number; y: number } => Boolean(point));
    if (!points.length) return { x: 50, y: 50 };
    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    return {
      x: (Math.min(...xValues) + Math.max(...xValues)) / 2,
      y: (Math.min(...yValues) + Math.max(...yValues)) / 2,
    };
  }, [locations, routeIds]);
  const routeStatus = routeSummary?.status ?? (variant === "recovery" ? "replanned" : "approved");
  const zoomIndex = MAP_ZOOM_LEVELS.findIndex((level) => level === viewport.zoom);
  const canZoomOut = zoomIndex > 0;
  const canZoomIn = zoomIndex >= 0 && zoomIndex < MAP_ZOOM_LEVELS.length - 1;

  const updateZoom = useCallback((direction: -1 | 1) => {
    setViewport((current) => {
      const currentIndex = MAP_ZOOM_LEVELS.findIndex((level) => level === current.zoom);
      const nextIndex = clamp(currentIndex + direction, 0, MAP_ZOOM_LEVELS.length - 1);
      const nextZoom = MAP_ZOOM_LEVELS[nextIndex];
      if (nextZoom === 1) return DEFAULT_VIEWPORT;
      return clampViewport({
        zoom: nextZoom,
        panX: ROUTE_FOCUS_SCREEN.x - 50 - (routeFocusPoint.x - 50) * nextZoom,
        panY: ROUTE_FOCUS_SCREEN.y - 50 - (routeFocusPoint.y - 50) * nextZoom,
      });
    });
  }, [routeFocusPoint]);

  const resetViewport = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
  }, []);

  const panViewport = useCallback((deltaX: number, deltaY: number) => {
    setViewport((current) => clampViewport({
      ...current,
      panX: current.panX + deltaX,
      panY: current.panY + deltaY,
    }));
  }, []);

  const selectLocation = useCallback((id: string, source: SelectionSource) => {
    setSelectedLocationId(id);
    lastSelectionTrigger.current = { id, source };
    const location = locations.find((candidate) => candidate.id === id);
    if (!location) return;
    setViewport((current) => {
      if (current.zoom === 1) return current;
      return clampViewport({
        ...current,
        panX: -(location.point.x - 50) * current.zoom,
        panY: -(location.point.y - 50) * current.zoom,
      });
    });
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>("#map-location-detail .map-detail-close")?.focus();
    });
  }, [locations, setSelectedLocationId]);

  const closeDetails = useCallback(() => {
    const trigger = lastSelectionTrigger.current;
    setSelectedLocationId(null);
    if (!trigger) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-testid="map-${trigger.source}-${trigger.id}"]`)?.focus();
    });
  }, [setSelectedLocationId]);

  useEffect(() => {
    if (!selectedLocation) return;
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDetails();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeDetails, selectedLocation]);

  function handleMapKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      updateZoom(1);
    } else if (event.key === "-") {
      event.preventDefault();
      updateZoom(-1);
    } else if (event.key === "0") {
      event.preventDefault();
      resetViewport();
    } else if (viewport.zoom > 1 && event.key.startsWith("Arrow")) {
      event.preventDefault();
      if (event.key === "ArrowLeft") panViewport(4, 0);
      if (event.key === "ArrowRight") panViewport(-4, 0);
      if (event.key === "ArrowUp") panViewport(0, 4);
      if (event.key === "ArrowDown") panViewport(0, -4);
    }
  }

  const handleMapWheel = useCallback((event: globalThis.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!interactive || !canvas || (Math.abs(event.deltaX) < 1 && Math.abs(event.deltaY) < 1)) return;
    if (event.target instanceof Element && event.target.closest("button, a, .map-detail-card, .map-zoom-controls")) return;
    event.preventDefault();

    const bounds = canvas.getBoundingClientRect();
    const isPinchZoom = event.ctrlKey || event.metaKey;
    const isCoarseWheel = event.deltaMode !== 0 || Math.abs(event.deltaY) >= 100;

    // Trackpad pinch gestures arrive as modified wheel events. Small, unmodified
    // trackpad deltas pan the map once it is zoomed; larger mouse-wheel deltas
    // retain the existing scroll-to-zoom behavior.
    if (isCoarseWheel) {
      updateZoom(event.deltaY < 0 ? 1 : -1);
      return;
    }

    if (isPinchZoom) {
      const now = performance.now();
      if (now - lastPinchZoomAt.current < 90) return;
      lastPinchZoomAt.current = now;
      updateZoom(event.deltaY < 0 ? 1 : -1);
      return;
    }

    if (viewport.zoom === 1) {
      updateZoom(event.deltaY < 0 ? 1 : -1);
      return;
    }

    if (viewport.zoom > 1) {
      panViewport(
        (-event.deltaX / bounds.width) * 100,
        (-event.deltaY / bounds.height) * 100,
      );
    }
  }, [interactive, panViewport, updateZoom, viewport.zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!interactive || !canvas) return;
    canvas.addEventListener("wheel", handleMapWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleMapWheel);
  }, [handleMapWheel, interactive]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || event.button !== 0 || viewport.zoom === 1) return;
    if (event.target instanceof Element && event.target.closest("button, a, .map-detail-card")) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: viewport.panX,
      panY: viewport.panY,
    };
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / bounds.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / bounds.height) * 100;
    setViewport((current) => clampViewport({
      ...current,
      panX: drag.panX + deltaX,
      panY: drag.panY + deltaY,
    }));
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  const viewportTransform = `translate(${viewport.panX} ${viewport.panY}) translate(50 50) scale(${viewport.zoom}) translate(-50 -50)`;

  return (
    <div className={`network-map-layout ${showList ? "with-list" : ""} ${interactive ? "map-interactive" : ""}`}>
      <div
        ref={canvasRef}
        className={`map-canvas ${viewport.zoom > 1 ? "map-canvas-zoomed" : ""} ${dragging ? "map-canvas-dragging" : ""}`}
        role={interactive ? "group" : "img"}
        aria-label="Schematic warehouse-origin route map for the current mission"
        aria-describedby={interactive ? "map-zoom-status" : undefined}
        tabIndex={interactive ? 0 : undefined}
        data-testid={interactive ? "network-map-canvas" : undefined}
        onKeyDown={interactive ? handleMapKeyDown : undefined}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerUp={interactive ? handlePointerEnd : undefined}
        onPointerCancel={interactive ? handlePointerEnd : undefined}
      >
        {interactive ? (
          <div className="map-canvas-identity">
            <MapPin size={14} aria-hidden="true" />
            <span>Local schematic · seeded coordinates</span>
          </div>
        ) : null}
        <svg className="map-streets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <g data-testid={interactive ? "map-viewport" : undefined} data-zoom={interactive ? viewport.zoom : undefined} transform={interactive ? viewportTransform : undefined}>
            <path className="map-water-shape" d="M0 0 H12 L9 16 L13 28 L8 43 L11 58 L6 73 L10 88 L7 100 H0 Z" />
            <path className="map-park-shape" d="M76 4 C86 8 94 6 100 12 V31 C91 27 83 30 76 23 Z M3 76 C14 69 22 75 29 88 L25 100 H6 Z" />
            <g className="map-minor-roads">
              <path d="M10 14 L93 85 M12 82 L89 10 M20 97 L83 5 M3 39 L98 47 M50 0 L45 100" />
              <path d="M14 7 L90 71 M18 28 L96 96 M7 57 L69 4 M25 0 L100 62 M0 91 L70 24" />
              <path d="M8 28 C26 20 31 42 49 32 S74 23 96 30 M7 63 C31 55 43 72 61 61 S80 54 98 65" />
            </g>
            <g className="map-arterial-roads">
              <path d="M1 44 C22 45 36 43 51 48 S77 54 100 52" />
              <path d="M47 0 C50 20 48 42 50 63 S48 84 46 100" />
              <path d="M17 94 C34 79 47 68 62 48 S78 23 91 8" />
            </g>
            {interactive ? (
              <g className="map-place-labels">
                <text x="24" y="27">Sunnyvale</text>
                <text x="42" y="37">Santa Clara</text>
                <text x="68" y="58" className="map-place-primary">San Jose</text>
                <text x="58" y="17">Milpitas</text>
                <text x="44" y="85">Campbell</text>
                <text x="34" y="52" className="map-road-label">Local corridor</text>
                <text x="52" y="69" className="map-road-label">Cross-town corridor</text>
              </g>
            ) : null}
            {layers.routes ? <polyline className="map-route-casing" points={route} /> : null}
            {layers.routes ? <polyline className={`map-route map-route-${routeStatus}`} data-testid="map-route-layer" data-route-status={routeStatus} points={route} /> : null}
            {layers.routes ? routeIds.map((id, index) => {
              const point = locations.find((location) => location.id === id)?.point;
              return point ? <circle key={id} className={`map-route-node map-route-node-${routeStatus}`} data-testid={`map-route-node-${id}`} cx={point.x} cy={point.y} r={index === 0 ? 1.9 : 1.5} /> : null;
            }) : null}
          </g>
        </svg>
        {markerLocations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            interactive={interactive}
            selected={selectedLocationId === location.id}
            routeVisible={layers.routes}
            routeStop={routeStopByLocation.get(location.id)}
            viewport={interactive ? viewport : DEFAULT_VIEWPORT}
            onSelect={selectLocation}
          />
        ))}
        {interactive ? (
          <div className="map-zoom-controls" aria-label="Map zoom controls">
            <button type="button" onClick={() => updateZoom(1)} disabled={!canZoomIn} aria-label="Zoom in map"><Plus size={17} aria-hidden="true" /></button>
            <output id="map-zoom-status" data-testid="map-zoom-status" aria-label="Map zoom" aria-live="polite">{Math.round(viewport.zoom * 100)}%</output>
            <button type="button" onClick={() => updateZoom(-1)} disabled={!canZoomOut} aria-label="Zoom out map"><Minus size={17} aria-hidden="true" /></button>
            <button type="button" onClick={resetViewport} disabled={viewport.zoom === 1 && viewport.panX === 0 && viewport.panY === 0} aria-label="Reset map view"><LocateFixed size={17} aria-hidden="true" /></button>
          </div>
        ) : null}
        {interactive && selectedLocation ? <MapDetailCard location={selectedLocation} routeStop={routeStopByLocation.get(selectedLocation.id)} routeVisible={layers.routes} onClose={closeDetails} /> : null}
        {interactive ? <div className="map-canvas-footer"><span><Snowflake size={13} aria-hidden="true" />Select a marker or route stop for details.</span><span>{viewport.zoom > 1 ? "Drag or trackpad-scroll to pan · pinch to zoom" : "Scroll or pinch to zoom"}</span></div> : null}
      </div>

      {showList ? interactive ? (
        <InteractiveLocationList locations={listLocations} routeSummary={routeSummary} routeStops={orderedRouteStops} layers={layers} routesVisible={layers.routes} selectedLocationId={selectedLocationId} onSelect={selectLocation} />
      ) : (
        <CompactLocationList locations={listLocations} routeSummary={routeSummary} />
      ) : null}
    </div>
  );
}
