"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, MapPinned, PackageCheck, Truck, UserRound } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { LoadingState } from "@/components/shared/loading-state";
import { Panel } from "@/components/shared/panel";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { drivers, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import { createMission, getNextCompletableMissionStopId } from "@/domain/execution/create-execution";
import { totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";
import { useDemoState } from "@/state/demo-state";

function stopName(locationId: string): string {
  if (locationId === warehouse.id) return warehouse.name;
  return getDestinationName(locationId);
}

function formatWindow(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}

export function MissionDetailClient({ missionId }: { missionId: "MSN-104" | "MSN-105" }) {
  const { state, hydrated, completeMissionStop } = useDemoState();
  const initialPlan = useMemo(() => {
    const set = generatePlanSet();
    return state.approvedPlan ?? state.planOverrides[state.selectedPlanId] ?? set.options.find((option) => option.id === state.selectedPlanId) ?? set.options[2];
  }, [state.approvedPlan, state.planOverrides, state.selectedPlanId]);
  const plan = missionId === "MSN-105" ? state.disruption?.recoveryOption ?? createRecoveryOption(generatePlanSet().options[2]) : initialPlan;
  const generatedMission = useMemo(() => createMission(plan, missionId), [missionId, plan]);
  const mission = state.missions[missionId] ?? generatedMission;
  const recovered = missionId === "MSN-105";
  const superseded = mission.status === "superseded";
  const delivered = mission.status === "delivered";
  const canCompleteStops = mission.status === "assigned" || mission.status === "in_transit";
  const nextCompletableStopId = getNextCompletableMissionStopId(mission);
  const affectedStop = mission.stops.find((stop) => stop.locationId === "PAR-002");
  const canTriggerDisruption = missionId === "MSN-104" && state.stage === "approved" && canCompleteStops && affectedStop?.status === "pending" && affectedStop.quantityDropoffLb > 0;
  const nextPendingDelivery = mission.stops.find((stop) => stop.status === "pending" && stop.locationType === "partner" && stop.quantityDropoffLb > 0);

  if (!hydrated) return <LoadingState label="Loading saved mission state…" />;

  if (!state.missions[missionId]) {
    return <><PageHeader title="Mission" subtitle="No mission has been created yet." breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Missions" }]} backHref={recovered ? "/simulate" : "/plans/PLN-104"} backLabel={recovered ? "Back to recovery" : "Back to plan"} status={<span className="plain-status plain-status-amber">Not created</span>} /><div className="route-state"><strong>{recovered ? "The replacement mission has not been created yet." : "The mission has not been created yet."}</strong><span>{recovered ? "Approve the partner-cancellation recovery before opening the replacement route." : "Approve a feasible allocation plan to create the mission."}</span><Link className="button button-primary" href={recovered ? "/simulate" : "/plans/PLN-104"}>{recovered ? "Open disruption recovery" : "Open plan"}</Link></div></>;
  }

  function completeStop(stopId: string) {
    completeMissionStop(missionId, stopId);
  }

  const mapHref = `/map?mission=${missionId}&returnTo=/missions/${missionId}`;

  return (
    <>
      <PageHeader title="Mission" subtitle={`Strawberry inventory release · ${recovered ? "Recovery route" : "Approved outbound route"}`} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Missions" }, { label: "Inventory release" }]} backHref={recovered ? "/packing/PKG-105" : "/packing/PKG-104"} backLabel="Back to Packing Plan" status={<span className={`plain-status ${superseded ? "plain-status-amber" : delivered ? "plain-status-green" : "plain-status-blue"}`}>{mission.status.replaceAll("_", " ")}</span>} />
      <div className="page-content execution-page mission-page refactor-mission-page">
        {recovered ? <div className="inline-success"><CheckCircle2 size={18} aria-hidden="true" />Recovery approved. The original route remains in the audit history.<Link href="/impact">View impact</Link></div> : null}
        <section className="execution-summary" aria-label="Mission summary"><div><span>Status</span><strong className={mission.status === "superseded" || mission.status === "replanning" ? "inline-amber" : "inline-green"}>{mission.status === "superseded" || mission.status === "replanning" ? <AlertTriangle size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}{mission.status.replaceAll("_", " ")}</strong></div><div><span>Vehicle</span><strong><Truck size={15} aria-hidden="true" />{vehicles[0].name} · {vehicles[0].capacityLb.toLocaleString()} lb</strong></div><div><span>Driver</span><strong><UserRound size={15} aria-hidden="true" />{drivers[0].name}</strong></div><div><span>Planned route</span><strong>{totalRouteMiles(mission.routeLegs).toFixed(1)} mi · {mission.stops.length} stops</strong></div></section>

        <div className="mission-grid refactor-mission-grid">
          <Panel title={recovered ? "Replanned route" : "Approved warehouse-origin route"} action={<Link className="panel-link" href={mapHref}><MapPinned size={14} aria-hidden="true" />Open map</Link>} className="mission-map-panel mission-route-panel"><div className="mission-route-preview"><div className="mission-route-preview-icon"><MapPinned size={24} aria-hidden="true" /></div><div><strong>{recovered ? "Replacement outbound route" : "Warehouse release ready for execution"}</strong><span>{mission.stops.length} ordered stops · {totalRouteMiles(mission.routeLegs).toFixed(1)} precomputed miles</span><small>The route begins at {warehouse.name} and includes current agency capacity, receiving windows, and synchronized stop details.</small></div><Link className="button button-secondary" href={mapHref}>Open route map<ArrowRight size={15} aria-hidden="true" /></Link></div></Panel>
          <Panel title="Ordered stops" className="stops-panel"><ol className="stop-list">{mission.stops.map((stop) => { const complete = stop.status === "complete"; const canceled = stop.status === "canceled"; const warehouseOrigin = stop.locationType === "warehouse"; return <li key={stop.id} className={complete ? "stop-complete" : canceled ? "stop-canceled" : ""}><span className="stop-sequence">{complete ? <CheckCircle2 size={16} aria-hidden="true" /> : canceled ? <AlertTriangle size={16} aria-hidden="true" /> : stop.sequence}</span><div><strong>{stopName(stop.locationId)}</strong><span>{formatWindow(stop.arrivalWindow.start, stop.arrivalWindow.end)}</span><small>{canceled ? `Canceled · ${stop.quantityDropoffLb.toLocaleString()} lb requires recovery` : warehouseOrigin ? `Load ${stop.quantityPickupLb.toLocaleString()} lb of outbound ${productLot.productName.toLowerCase()}` : `Drop off ${stop.quantityDropoffLb.toLocaleString()} lb`}</small></div><button className="icon-button" type="button" disabled={!canCompleteStops || nextCompletableStopId !== stop.id || complete || canceled} onClick={() => completeStop(stop.id)} aria-label={`Mark ${stopName(stop.locationId)} complete`}><PackageCheck size={17} aria-hidden="true" /></button></li>; })}</ol></Panel>
        </div>

        <DetailsAccordion title="Execution details"><div className="mission-lower-grid"><Panel title="Mission timeline"><ol className="activity-list mission-timeline"><li><span className="activity-dot green" /><div><strong>Human approval recorded</strong><small>demo_user · Approved {plan.name}</small></div></li><li><span className="activity-dot blue" /><div><strong>Vehicle and driver assigned</strong><small>{vehicles[0].name} · {drivers[0].name}</small></div></li>{recovered ? <li><span className="activity-dot purple" /><div><strong>Replacement route created</strong><small>Original work remains auditable</small></div></li> : null}{superseded ? <li><span className="activity-dot purple" /><div><strong>Original route superseded</strong><small>The replacement route is active</small></div></li> : null}</ol></Panel><Panel title="Receiving window watch">{nextPendingDelivery ? <div className="window-watch"><Clock3 aria-hidden="true" /><div><strong>Next window · {formatWindow(nextPendingDelivery.arrivalWindow.start, nextPendingDelivery.arrivalWindow.end)}</strong><span>{stopName(nextPendingDelivery.locationId)} · {nextPendingDelivery.quantityDropoffLb.toLocaleString()} lb</span></div><span className="plain-status plain-status-amber">Pending</span></div> : <div className="window-watch"><CheckCircle2 aria-hidden="true" /><div><strong>No pending receiving window</strong><span>{delivered ? "All delivery stops are complete." : "No active partner delivery remains on this mission."}</span></div><span className="plain-status plain-status-green">Clear</span></div>}</Panel></div><DetailsAccordion title="Technical details"><p>Mission record {mission.id} · approved plan {mission.approvedPlanOptionId} · vehicle {mission.vehicleId}.</p></DetailsAccordion></DetailsAccordion>

        <StickyActionBar status={<><span className="sticky-status-icon">{delivered || recovered ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}</span><span><strong>{delivered ? "Mission delivered" : recovered ? "Recovery route ready" : superseded ? "Mission superseded" : canTriggerDisruption ? "Disruption recovery is available" : "Mission execution in progress"}</strong><small>{delivered ? "All active stops are complete; the mission is read-only." : recovered ? "All 1,200 lb remain accounted for." : canTriggerDisruption ? "Changes require a second human approval." : "Complete route stops in order to preserve execution history."}</small></span></>}>
          <Link className="button button-secondary" href={mapHref}>Open map</Link>
          {delivered || recovered ? <Link className="button button-primary" href="/impact">View impact<ArrowRight size={16} aria-hidden="true" /></Link> : state.stage === "recovered" ? <Link className="button button-primary" href="/missions/MSN-105">View replacement mission<ArrowRight size={16} aria-hidden="true" /></Link> : state.stage === "disrupted" ? <Link className="button button-primary" href="/simulate">Review recovery<ArrowRight size={16} aria-hidden="true" /></Link> : canTriggerDisruption ? <Link className="button button-primary" href={`/simulate?mission=${missionId}`}>Report disruption<ArrowRight size={16} aria-hidden="true" /></Link> : null}
        </StickyActionBar>
      </div>
    </>
  );
}
