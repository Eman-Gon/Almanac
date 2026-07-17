"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Filter, Package, Route, Snowflake, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { DecisionMap } from "@/components/map/decision-map";
import type { MapLayers, MapRouteSummary } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { partners, productLot, warehouse } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import { totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { scenarioContext } from "@/domain/planning/scenario-context";
import type { Mission } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";

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

function statusTone(status: string): "green" | "amber" | "red" {
  if (status === "available") return "green";
  if (status === "limited") return "amber";
  return "red";
}

function routeDisplayStatus(
  mission: Mission | undefined,
  recovery: boolean,
  hasApprovedPlan: boolean,
): MapRouteSummary["status"] {
  if (!mission) return hasApprovedPlan ? "approved" : "candidate";

  switch (mission.status) {
    case "superseded":
    case "delivered":
    case "closed":
      return mission.status;
    case "disrupted":
    case "replanning":
      return "disrupted";
    case "approved":
    case "assigned":
    case "in_transit":
      return recovery ? "replanned" : "approved";
    case "draft":
      return "candidate";
  }
}

function routeStatusLabel(status: MapRouteSummary["status"]): string {
  switch (status) {
    case "candidate": return "Candidate route";
    case "disrupted": return "Replanning required";
    case "replanned": return "Replanned route";
    case "superseded": return "Superseded route";
    case "delivered": return "Delivered route";
    case "closed": return "Closed route";
    case "approved": return "Approved route";
  }
}

function routeStatusTone(status: MapRouteSummary["status"]): "blue" | "green" | "amber" | "red" {
  if (status === "candidate" || status === "closed") return "blue";
  if (status === "disrupted") return "red";
  if (status === "superseded") return "amber";
  return "green";
}

function routeSummaryLabel(status: MapRouteSummary["status"], missionId: string, planName: string): string {
  switch (status) {
    case "superseded": return `${missionId} · Superseded route`;
    case "delivered": return `${missionId} · Delivered route`;
    case "closed": return `${missionId} · Closed route`;
    case "disrupted": return `${missionId} · Replanning required`;
    case "replanned": return `${missionId} · Replacement route`;
    case "approved": return `${planName} · Approved`;
    case "candidate": return `${planName} · Candidate`;
  }
}

export default function MapPage() {
  const { hydrated, state } = useDemoState();
  const searchParams = useSearchParams();
  const [layers, setLayers] = useState<MapLayers>({ routes: true, demand: true, capacity: true, vehicles: true });
  const [selectedMapLocationId, setSelectedMapLocationId] = useState<string | null>(null);
  const requestedMissionId = searchParams.get("mission");
  const requestedPlanId = searchParams.get("plan");
  const planSet = useMemo(() => generatePlanSet(), []);
  const missionIdIsValid = requestedMissionId === null
    || requestedMissionId === scenarioContext.ids.primaryMissionId
    || requestedMissionId === scenarioContext.ids.recoveryMissionId;
  const planIdIsValid = requestedPlanId === null || requestedPlanId === planSet.id;
  const invalidMapContext = !missionIdIsValid || !planIdIsValid;
  const explicitMissionId = requestedMissionId === scenarioContext.ids.primaryMissionId
    || requestedMissionId === scenarioContext.ids.recoveryMissionId
    ? requestedMissionId
    : null;
  const explicitPlanContext = explicitMissionId === null && requestedPlanId === planSet.id;
  const contextMissionId = explicitMissionId
    ?? (explicitPlanContext || state.stage !== "recovered"
      ? scenarioContext.ids.primaryMissionId
      : scenarioContext.ids.recoveryMissionId);
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam?.startsWith("/") ? returnToParam : "/dashboard";
  const recovery = contextMissionId === scenarioContext.ids.recoveryMissionId;

  const replacementMissionUnavailable = !invalidMapContext && recovery && (
    state.stage !== "recovered"
    || !state.disruption
    || !state.missions[scenarioContext.ids.recoveryMissionId]
  );

  if (!hydrated) return <LoadingState label="Loading saved map state…" />;

  if (invalidMapContext) {
    return (
      <>
        <PageHeader
          title="Map context not found"
          subtitle="The requested plan or mission is not part of this demo scenario."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Map" }]}
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          status={<span className="plain-status plain-status-amber">Unknown context</span>}
        />
        <div className="page-content map-page">
          <EmptyState
            title="That Almanac record was not found."
            action={<Link className="button button-primary" href="/map">Open current network map</Link>}
          >Check the mission or plan link, or return to the current seeded map.</EmptyState>
        </div>
      </>
    );
  }

  if (replacementMissionUnavailable) {
    return (
      <>
        <PageHeader
          title="Route map"
          subtitle="The replacement route is available only after human approval creates MSN-105."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Recovery", href: "/simulate?mission=MSN-104" }, { label: "Map" }]}
          backHref="/simulate?mission=MSN-104"
          backLabel="Back to recovery"
          status={<span className="plain-status plain-status-amber">Not created</span>}
        />
        <div className="page-content map-page">
          <EmptyState
            title="Replacement mission not created"
            action={<Link className="button button-primary" href="/simulate?mission=MSN-104">Review recovery plan</Link>}
          >Human approval is required before Almanac can display a replacement route.</EmptyState>
        </div>
      </>
    );
  }

  const selectedPlan = state.approvedPlan
    ?? state.planOverrides[state.selectedPlanId]
    ?? planSet.options.find((option) => option.id === state.selectedPlanId)
    ?? planSet.options[2];
  const activePlan = recovery
    ? state.disruption!.recoveryOption
    : selectedPlan;
  const missionId = contextMissionId;
  const persistedMission = explicitPlanContext ? undefined : state.missions[missionId];
  const mission = recovery ? persistedMission! : persistedMission ?? createMission(activePlan, missionId);
  const routeStatus = explicitPlanContext
    ? state.approvedPlan ? "approved" : "candidate"
    : routeDisplayStatus(persistedMission, recovery, Boolean(state.approvedPlan));
  const disrupted = routeStatus === "disrupted";
  const stagingLb = activePlan.allocations
    .filter((allocation) => allocation.handling === "pack")
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  const stagingCapacityLb = warehouse.refrigeratedStagingCapacityAvailableLb;
  const stagingPct = Math.round((stagingLb / stagingCapacityLb) * 100);
  const routePartnerIds = new Set(mission.stops.filter((stop) => stop.locationType === "partner").map((stop) => stop.locationId));
  const routePartners = partners.filter((partner) => routePartnerIds.has(partner.id));
  const highestServiceGap = Math.max(...partners.map((partner) => partner.recentServiceGap));
  const watchedPartner = routePartners
    .slice()
    .sort((a, b) => Date.parse(a.receivingWindows[0]?.end ?? "") - Date.parse(b.receivingWindows[0]?.end ?? ""))[0];
  const routeSummary: MapRouteSummary = {
    label: routeSummaryLabel(routeStatus, missionId, activePlan.name),
    miles: totalRouteMiles(mission.routeLegs),
    stops: mission.stops.length,
    loadLb: mission.stops.find((stop) => stop.locationType === "warehouse")?.quantityPickupLb ?? 0,
    status: routeStatus,
  };

  let contextMessage: string;
  if (routeStatus === "superseded") {
    contextMessage = "MSN-104 was superseded after human approval. Open MSN-105 to inspect the active replacement route.";
  } else if (routeStatus === "delivered" || routeStatus === "closed") {
    contextMessage = `${missionId} is ${routeStatus}. This route remains visible for calculated impact and audit review.`;
  } else if (recovery) {
    contextMessage = `${state.disruption?.affectedQuantityLb.toLocaleString() ?? "Affected"} lb moved off Eastside after cancellation. The replacement route keeps the quantity accounted for and raises meal-kit staging to ${stagingLb.toLocaleString()} lb.`;
  } else if (disrupted) {
    contextMessage = `${state.disruption?.affectedQuantityLb.toLocaleString() ?? "Affected"} lb at Eastside is canceled and still requires a human-approved recovery plan. The interrupted route remains visible for decision context.`;
  } else {
    contextMessage = `${stagingLb.toLocaleString()} lb uses ${stagingPct}% of short-dwell cold staging. Use the route stops below to check receiving windows before approval.`;
  }

  const routeContextDescription = routeStatus === "superseded"
    ? "Original route retained for audit context"
    : routeStatus === "delivered" || routeStatus === "closed"
      ? "Completed route retained for audit context"
      : recovery
        ? "Replacement route after Eastside cancellation"
        : disrupted
          ? "Interrupted route awaiting human-approved recovery"
          : "Warehouse origin → partner receiving stops";

  return (
    <>
      <PageHeader
        title={requestedMissionId || requestedPlanId ? "Route map" : "Network map"}
        subtitle={`${recovery ? "Recovery route" : activePlan.name} · ${productLot.productName} · ${productLot.availableQuantityLb.toLocaleString()} lb available inventory`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: requestedMissionId ? "Mission" : "Plans", href: requestedMissionId ? `/missions/${missionId}` : "/plans/PLN-104" }, { label: "Map" }]}
        backHref={returnTo}
        backLabel={returnTo.includes("/missions/") ? "Back to Mission" : returnTo.includes("/plans/") ? "Back to Plan" : returnTo.includes("/partners/") ? "Back to Partner" : "Back to Dashboard"}
        status={<span className={`plain-status plain-status-${routeStatusTone(routeSummary.status)}`}>{routeStatusLabel(routeSummary.status)}</span>}
      />
      <div className="page-content map-page">
        <Panel className="full-map-panel map-workspace">
          <div className="map-workspace-header">
            <div className="map-workspace-title">
              <div>
                <h2>Network decision map</h2>
                <span className={`map-workspace-state map-workspace-state-${routeSummary.status}`}><i aria-hidden="true" />{routeSummary.label}</span>
              </div>
              <p>{routeContextDescription}</p>
            </div>
            <div className="map-story-facts" aria-label="Route story">
              <span><Package size={15} aria-hidden="true" /><strong>{productLot.availableQuantityLb.toLocaleString()} lb</strong> available {productLot.productName.toLowerCase()}</span>
              <span><Clock3 size={15} aria-hidden="true" />Risk deadline <strong>Jul 16 · {formatTime(productLot.riskDeadline)}</strong></span>
              <span><Route size={15} aria-hidden="true" /><strong>{routeSummary.miles.toFixed(1)} mi</strong></span>
              <span><strong>{routeSummary.stops}</strong> stops</span>
            </div>
          </div>
          <div className="map-workspace-controls">
            <div className="map-controls" aria-label="Map layers">
              <span><Filter size={16} aria-hidden="true" />Layers</span>
              {Object.entries(layers).map(([key, value]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => {
                      setSelectedMapLocationId(null);
                      setLayers((current) => ({ ...current, [key]: !current[key as keyof MapLayers] }));
                    }}
                  />
                  {key === "demand" ? "Demand partners" : key === "capacity" ? "Warehouse capacity" : key === "vehicles" ? "Vehicles" : "Routes"}
                </label>
              ))}
              <span className="map-control-note"><Snowflake size={15} aria-hidden="true" />Refrigerated product fit</span>
            </div>
          </div>
          <DecisionMap
            layers={layers}
            routeSummary={routeSummary}
            routeStops={mission.stops}
            routeLegs={mission.routeLegs}
            ghostRouteStops={recovery ? state.missions[scenarioContext.ids.primaryMissionId]?.stops : undefined}
            activePlan={activePlan}
            selectedLocationId={selectedMapLocationId}
            onSelectedLocationChange={setSelectedMapLocationId}
          />
        </Panel>

        <section className="map-decision-summary" aria-label="Map decision summary">
          <div className={`map-context-banner ${recovery ? "map-context-recovery" : ""} ${disrupted ? "map-context-disrupted" : ""}`}>
            {recovery || disrupted ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            <div><span className="map-eyebrow">What the map says</span><strong>{contextMessage}</strong></div>
          </div>
          <div className="map-operational-facts">
            <div><Snowflake size={16} aria-hidden="true" /><span>Cold staging<strong>{stagingLb.toLocaleString()} / {stagingCapacityLb.toLocaleString()} lb · {stagingPct}% used</strong></span></div>
            <div><Clock3 size={16} aria-hidden="true" /><span>Window watch<strong>{watchedPartner ? `${watchedPartner.name} closes ${formatTime(watchedPartner.receivingWindows[0].end)}` : "Window data unavailable"}</strong></span></div>
            <div><UsersRound size={16} aria-hidden="true" /><span>Service gap<strong>{highestServiceGap} / 100 highest documented gap</strong></span></div>
          </div>
        </section>

        <DetailsAccordion title="Partner capacity, demand, and receiving windows">
          <div className="map-partner-meta">{partners.length} partner records · use the route list above for the current stop sequence.</div>
          <div className="table-scroll">
            <table className="data-table partner-map-table">
              <thead><tr><th>Partner</th><th>Status</th><th>Demand / service gap</th><th>Cold capacity</th><th>Receiving window</th><th>Historical produce acceptance</th><th>Route relevance</th></tr></thead>
              <tbody>
                {partners.map((partner) => {
                  const status = state.partnerStatusOverrides[partner.id] ?? partner.status;
                  const demand = partner.demandSignals[0];
                  const acceptance = partner.acceptanceHistory.find((history) => history.category === productLot.category);
                  const onRoute = routePartnerIds.has(partner.id);
                  const routeStop = mission.stops.find((stop) => stop.locationId === partner.id);
                  const canceledRouteStop = routeStop?.status === "canceled";
                  return (
                    <tr key={partner.id}>
                      <td><Link href={`/partners/${partner.id}`}><strong>{partner.name}</strong><span>{partner.location.city} · {titleCase(partner.agencyType)}</span></Link></td>
                      <td><span className={`plain-status plain-status-${statusTone(status)}`}>{status === "limited" ? "Limited" : titleCase(status)}</span></td>
                      <td><strong>{demand?.desiredQuantityLb.toLocaleString() ?? "—"} lb</strong><span>{demand ? `${titleCase(demand.urgency)} need · gap ${partner.recentServiceGap}/100` : "Demand unknown"}</span></td>
                      <td><strong>{partner.refrigeratedCapacityAvailableLb.toLocaleString()} lb</strong><span>Compatible refrigerated capacity</span></td>
                      <td>{partner.receivingWindows[0] ? formatWindow(partner.receivingWindows[0]) : "Window unknown"}</td>
                      <td>{acceptance ? <><strong>{acceptance.acceptanceRatePct}% full acceptance</strong><span>{acceptance.acceptedCount} accepted · {acceptance.refusedCount} refused · {acceptance.shortReceiptCount} short · n={acceptance.sampleSize}</span></> : "History unknown"}</td>
                      <td>
                        {canceledRouteStop ? (
                          <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Canceled stop</span>
                        ) : status === "canceled" || status === "unavailable" ? (
                          <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Excluded</span>
                        ) : onRoute ? (
                          <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />On route</span>
                        ) : (
                          <span className="plain-status plain-status-blue">Context</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DetailsAccordion>
      </div>
    </>
  );
}
