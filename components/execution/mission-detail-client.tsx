"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NetworkMap } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { drivers, donor, vehicles, warehouse } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import { totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";
import { useDemoState } from "@/state/demo-state";

function stopName(locationId: string): string {
  if (locationId === donor.id) return donor.name;
  if (locationId === warehouse.id) return warehouse.name;
  return getDestinationName(locationId);
}

function formatWindow(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}

export function MissionDetailClient({ missionId }: { missionId: "MSN-104" | "MSN-105" }) {
  const { state } = useDemoState();
  const [completedStops, setCompletedStops] = useState<Set<string>>(() => new Set());
  const initialPlan = useMemo(() => {
    const set = generatePlanSet();
    return set.options.find((option) => option.id === state.selectedPlanId) ?? set.options[2];
  }, [state.selectedPlanId]);
  const plan = missionId === "MSN-105" ? createRecoveryOption(initialPlan) : initialPlan;
  const mission = useMemo(() => createMission(plan, missionId), [missionId, plan]);
  const recovered = missionId === "MSN-105";

  function completeStop(stopId: string) {
    setCompletedStops((current) => new Set(current).add(stopId));
  }

  return (
    <>
      <PageHeader
        title="Mission Detail"
        subtitle={`${mission.id} · ${recovered ? "Recovery route" : "Strawberry Rescue"}`}
        actions={<Link className="button button-ghost" href="/packing/PKG-104"><ArrowLeft size={16} aria-hidden="true" />View packing plan</Link>}
      />
      <div className="page-content execution-page mission-page">
        {recovered ? <div className="inline-success"><CheckCircle2 size={18} aria-hidden="true" />Recovery approved. This mission preserves MSN-104 in the audit history.<Link href="/impact?mission=MSN-105">View impact</Link></div> : null}
        <section className="execution-summary" aria-label="Mission summary">
          <div><span>Status</span><strong className="inline-green"><CheckCircle2 size={15} aria-hidden="true" />Assigned</strong></div>
          <div><span>Vehicle</span><strong><Truck size={15} aria-hidden="true" />{vehicles[0].name} · 1,400 lb</strong></div>
          <div><span>Driver</span><strong><UserRound size={15} aria-hidden="true" />{drivers[0].name}</strong></div>
          <div><span>Route</span><strong>{totalRouteMiles(mission.routeLegs).toFixed(1)} mi · {mission.stops.length} stops</strong></div>
        </section>

        <div className="mission-grid">
          <Panel title={recovered ? "Replanned route" : "Approved route"} className="mission-map-panel">
            <NetworkMap variant={recovered ? "recovery" : "initial"} />
          </Panel>
          <Panel title="Ordered stops" className="stops-panel">
            <ol className="stop-list">
              {mission.stops.map((stop) => {
                const complete = completedStops.has(stop.id);
                return (
                  <li key={stop.id} className={complete ? "stop-complete" : ""}>
                    <span className="stop-sequence">{complete ? <CheckCircle2 size={16} aria-hidden="true" /> : stop.sequence}</span>
                    <div><strong>{stopName(stop.locationId)}</strong><span>{formatWindow(stop.arrivalWindow.start, stop.arrivalWindow.end)}</span><small>{stop.quantityPickupLb ? `Pick up ${stop.quantityPickupLb.toLocaleString()} lb` : `Drop off ${stop.quantityDropoffLb.toLocaleString()} lb`}</small></div>
                    <button className="icon-button" type="button" disabled={complete} onClick={() => completeStop(stop.id)} aria-label={`Mark ${stopName(stop.locationId)} complete`}><PackageCheck size={17} /></button>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>

        <div className="mission-lower-grid">
          <Panel title="Mission timeline">
            <ol className="activity-list mission-timeline">
              <li><span className="activity-dot green" /><div><strong>Human approval recorded</strong><small>demo_user · Approved {plan.name}</small></div></li>
              <li><span className="activity-dot blue" /><div><strong>Vehicle and driver assigned</strong><small>{vehicles[0].name} · {drivers[0].name}</small></div></li>
              {recovered ? <li><span className="activity-dot purple" /><div><strong>Replacement mission created</strong><small>MSN-105 retains MSN-104 history</small></div></li> : null}
            </ol>
          </Panel>
          <Panel title="Receiving window watch">
            <div className="window-watch">
              <Clock3 aria-hidden="true" />
              <div><strong>Next window closes at 12:00 PM</strong><span>Harbor Light Pantry · 420 lb</span></div>
              <span className="plain-status plain-status-amber">48 min remaining</span>
            </div>
          </Panel>
        </div>

        <div className="sticky-action-rail">
          <div>{recovered ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}<span><strong>{recovered ? "Recovery route ready" : "Disruption recovery is available"}</strong><small>{recovered ? "All 1,200 lb remain accounted for." : "Changes require a second human approval."}</small></span></div>
          <div className="rail-actions">
            <Link className="button button-secondary" href="/map">Open full map</Link>
            {recovered ? <Link className="button button-primary" href="/impact?mission=MSN-105">View impact<ArrowRight size={16} aria-hidden="true" /></Link> : <Link className="button button-danger" href="/simulate?mission=MSN-104">Trigger disruption<ArrowRight size={16} aria-hidden="true" /></Link>}
          </div>
        </div>
      </div>
    </>
  );
}
