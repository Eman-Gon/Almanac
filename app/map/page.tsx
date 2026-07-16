"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Filter, Package, Route, Snowflake, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NetworkMap, type MapLayers, type MapRouteSummary } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { donation, partners, warehouse } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import { totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";
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

export default function MapPage() {
  const { hydrated, state } = useDemoState();
  const searchParams = useSearchParams();
  const [layers, setLayers] = useState<MapLayers>({ routes: true, demand: true, capacity: true, vehicles: true });
  const requestedMissionId = searchParams.get("mission");
  const requestedPlanId = searchParams.get("plan");
  const contextMissionId = requestedMissionId === "MSN-105" || (!requestedMissionId && state.stage === "recovered") ? "MSN-105" : "MSN-104";
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam?.startsWith("/") ? returnToParam : "/dashboard";
  const recovery = contextMissionId === "MSN-105";
  const disrupted = state.stage === "disrupted" && contextMissionId === "MSN-104";

  const planSet = useMemo(() => generatePlanSet(), []);
  const replacementMissionUnavailable = recovery && (
    state.stage !== "recovered"
    || !state.disruption
    || !state.missions["MSN-105"]
  );

  if (!hydrated) return <LoadingState label="Loading saved map state…" />;

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
          >Human approval is required before ChoiceGrid can display a replacement route.</EmptyState>
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
  const mission = recovery ? state.missions[missionId]! : state.missions[missionId] ?? createMission(activePlan, missionId);
  const routeLocationIds = mission.stops.map((stop) => stop.locationId);
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
    label: recovery ? "MSN-105 · Replacement route" : disrupted ? "MSN-104 · Replanning required" : state.approvedPlan ? `${activePlan.name} · Approved` : `${activePlan.name} · Candidate`,
    miles: totalRouteMiles(mission.routeLegs),
    stops: mission.stops.length,
    loadLb: donation.quantityLb,
    status: recovery ? "replanned" : disrupted ? "disrupted" : state.approvedPlan ? "approved" : "candidate",
  };

  const contextMessage = recovery
    ? `${state.disruption?.affectedQuantityLb.toLocaleString() ?? "Affected"} lb moved off Eastside after cancellation. The replacement route keeps the quantity accounted for and raises meal-kit staging to ${stagingLb.toLocaleString()} lb.`
    : disrupted
      ? `${state.disruption?.affectedQuantityLb.toLocaleString() ?? "Affected"} lb at Eastside is canceled and still requires a human-approved recovery plan. The interrupted route remains visible for decision context.`
    : `${stagingLb.toLocaleString()} lb uses ${stagingPct}% of short-dwell cold staging. Use the route stops below to check receiving windows before approval.`;

  return (
    <>
      <PageHeader
        title={requestedMissionId || requestedPlanId ? "Route map" : "Network map"}
        subtitle={`${recovery ? "Recovery route" : activePlan.name} · ${donation.productDescription} · ${donation.quantityLb.toLocaleString()} lb`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: recovery ? "Mission" : "Plans", href: recovery ? `/missions/${missionId}` : "/plans/PLN-104" }, { label: "Map" }]}
        backHref={returnTo}
        backLabel={returnTo.includes("/missions/") ? "Back to Mission" : returnTo.includes("/plans/") ? "Back to Plan" : returnTo.includes("/partners/") ? "Back to Partner" : "Back to Dashboard"}
        status={<span className={`plain-status ${routeSummary.status === "disrupted" ? "plain-status-red" : routeSummary.status === "replanned" ? "plain-status-amber" : "plain-status-green"}`}>{routeSummary.status === "candidate" ? "Candidate route" : routeSummary.status === "disrupted" ? "Replanning required" : routeSummary.status === "replanned" ? "Replanned route" : "Approved route"}</span>}
      />
      <div className="page-content map-page">
        <Panel className="full-map-panel map-workspace">
          <div className="map-workspace-header">
            <div className="map-workspace-title">
              <div>
                <h2>Network decision map</h2>
                <span className={`map-workspace-state map-workspace-state-${routeSummary.status}`}><i aria-hidden="true" />{routeSummary.label}</span>
              </div>
              <p>{recovery ? "Replacement route after Eastside cancellation" : disrupted ? "Interrupted route awaiting human-approved recovery" : "Donor pickup → cold staging → partner deliveries"}</p>
            </div>
            <div className="map-story-facts" aria-label="Route story">
              <span><Package size={15} aria-hidden="true" /><strong>{donation.quantityLb.toLocaleString()} lb</strong> {donation.productDescription.toLowerCase()}</span>
              <span><Clock3 size={15} aria-hidden="true" />Pickup by <strong>{formatTime(donation.pickupWindow?.end ?? "2026-07-15T13:00:00-07:00")}</strong></span>
              <span><Route size={15} aria-hidden="true" /><strong>{routeSummary.miles.toFixed(1)} mi</strong></span>
              <span><strong>{routeSummary.stops}</strong> stops</span>
            </div>
          </div>
          <div className="map-workspace-controls">
            <div className="map-controls" aria-label="Map layers">
              <span><Filter size={16} aria-hidden="true" />Layers</span>
              {Object.entries(layers).map(([key, value]) => (
                <label key={key}>
                  <input type="checkbox" checked={value} onChange={() => setLayers((current) => ({ ...current, [key]: !current[key as keyof MapLayers] }))} />
                  {key === "demand" ? "Demand partners" : key === "capacity" ? "Warehouse capacity" : key === "vehicles" ? "Vehicles" : "Routes"}
                </label>
              ))}
              <span className="map-control-note"><Snowflake size={15} aria-hidden="true" />Refrigerated product fit</span>
            </div>
          </div>
          <NetworkMap variant={recovery ? "recovery" : "initial"} layers={layers} interactive routeSummary={routeSummary} routeStops={mission.stops} routeLocationIds={routeLocationIds} />
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
              <thead><tr><th>Partner</th><th>Status</th><th>Demand / service gap</th><th>Cold capacity</th><th>Receiving window</th><th>Route relevance</th></tr></thead>
              <tbody>
                {partners.map((partner) => {
                  const status = state.partnerStatusOverrides[partner.id] ?? partner.status;
                  const demand = partner.demandSignals[0];
                  const onRoute = routePartnerIds.has(partner.id);
                  return (
                    <tr key={partner.id}>
                      <td><Link href={`/partners/${partner.id}`}><strong>{partner.name}</strong><span>{partner.location.city} · {titleCase(partner.agencyType)}</span></Link></td>
                      <td><span className={`plain-status plain-status-${statusTone(status)}`}>{status === "limited" ? "Limited" : titleCase(status)}</span></td>
                      <td><strong>{demand?.desiredQuantityLb.toLocaleString() ?? "—"} lb</strong><span>{demand ? `${titleCase(demand.urgency)} need · gap ${partner.recentServiceGap}/100` : "Demand unknown"}</span></td>
                      <td><strong>{partner.refrigeratedCapacityAvailableLb.toLocaleString()} lb</strong><span>Compatible refrigerated capacity</span></td>
                      <td>{partner.receivingWindows[0] ? formatWindow(partner.receivingWindows[0]) : "Window unknown"}</td>
                      <td>{onRoute ? <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />On route</span> : status === "canceled" || status === "unavailable" ? <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Excluded</span> : <span className="plain-status plain-status-blue">Context</span>}</td>
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
