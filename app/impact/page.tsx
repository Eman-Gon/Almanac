"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Gauge,
  Route,
  Scale,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { donation, scenario } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import { spoilageAvoidancePct, totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";
import { useDemoState } from "@/state/demo-state";

export default function ImpactPage() {
  const { state, hydrated } = useDemoState();
  const planSet = useMemo(() => generatePlanSet(), []);
  const original =
    state.approvedPlan ??
    state.planOverrides[state.selectedPlanId] ??
    planSet.options.find((option) => option.id === state.selectedPlanId) ??
    planSet.options[2];
  const recovered = state.stage === "recovered";
  const plan = recovered
    ? state.disruption?.recoveryOption ?? createRecoveryOption(original)
    : original;
  const missionId = recovered ? "MSN-105" : "MSN-104";
  const mission = state.missions[missionId] ?? createMission(plan, missionId);
  const originalMission = state.missions["MSN-104"] ?? createMission(original);
  const spoilagePct = spoilageAvoidancePct(scenario.baselineExpectedSpoilageLb, plan.metrics.expectedSpoilageLb) ?? 0;
  const events = state.auditEvents;
  const overrideCount = events.filter(
    (event) => event.eventType === "plan_allocations_edited",
  ).length;
  const affectedQuantityLb = state.disruption?.affectedQuantityLb ?? 0;
  const alternateQuantityLb = plan.allocations.find((allocation) => allocation.destinationId === "PAR-004")?.quantityLb ?? 0;
  const originalMealKitLb = original.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb ?? 0;
  const recoveredMealKitLb = plan.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb ?? originalMealKitLb;

  const metrics = [
    { label: "Pounds offered", value: "1,200 lb", detail: "Simulated input", icon: Scale, tone: "blue" },
    { label: "Assigned in time", value: `${plan.metrics.quantityDistributedInTimeLb.toLocaleString()} lb`, detail: "Calculated from scenario", icon: CheckCircle2, tone: "green" },
    { label: "Households supported", value: String(plan.metrics.estimatedHouseholdsSupported), detail: `Simulated estimate · ${scenario.householdWeightLb} lb each`, icon: UsersRound, tone: "purple" },
    { label: "Modeled spoilage avoided", value: `${spoilagePct}%`, detail: "Calculated estimate", icon: Gauge, tone: "green" },
    { label: "Route miles", value: `${totalRouteMiles(mission.routeLegs).toFixed(1)} mi`, detail: "Seeded distance matrix", icon: Route, tone: "blue" },
    { label: "Replanning time", value: recovered ? `${scenario.modeledReplanningSeconds} sec` : "—", detail: recovered ? "Modeled scenario interval" : "No recovery approved", icon: Clock3, tone: "amber" },
  ] as const;

  if (!hydrated) {
    return <div className="route-state"><strong>Loading saved impact state…</strong></div>;
  }

  if (!state.approvedPlan) {
    return (
      <>
        <PageHeader title="Impact & Audit" subtitle="No approved mission" />
        <div className="route-state">
          <strong>Impact is calculated after human approval.</strong>
          <span>Approve a feasible plan before reviewing mission outcomes.</span>
          <Link className="button button-primary" href="/plans/PLN-104">Open Decision Room</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Impact & Audit" subtitle={`${recovered ? "MSN-105" : "MSN-104"} · Calculated outcomes and decision history`} actions={<Link className="button button-ghost" href={recovered ? "/missions/MSN-105" : "/missions/MSN-104"}><ArrowLeft size={16} aria-hidden="true" />Back to mission</Link>} />
      <div className="page-content impact-page">
        <div className="evidence-banner"><CheckCircle2 size={18} aria-hidden="true" /><div><strong>All values use synthetic scenario data</strong><span>Operational metrics are calculated by deterministic services; no LLM supplies quantities, routes, or impact.</span></div></div>

        <section className="impact-metric-grid" aria-label="Scenario impact metrics">
          {metrics.map((metric) => { const Icon = metric.icon; return <article className={`impact-card impact-${metric.tone}`} key={metric.label}><Icon aria-hidden="true" /><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>; })}
        </section>

        {recovered ? <Panel title="Before & after recovery"><div className="before-after-grid"><div><span>Original mission · MSN-104</span><strong>Eastside partner · {affectedQuantityLb} lb</strong><small>{totalRouteMiles(originalMission.routeLegs).toFixed(1)} mi · Superseded after disruption</small></div><div className="change-arrow">→</div><div><span>Replacement mission · MSN-105</span><strong>Northside {alternateQuantityLb} lb · Kitchen +{recoveredMealKitLb - originalMealKitLb} lb</strong><small>{totalRouteMiles(mission.routeLegs).toFixed(1)} mi · All hard constraints pass</small></div></div></Panel> : null}

        <div className="impact-grid">
          <Panel title="Allocation by destination">
            <div className="allocation-bars">
              {plan.allocations.map((allocation) => <div key={allocation.id}><span>{getDestinationName(allocation.destinationId)}</span><div><i style={{ width: `${(allocation.quantityLb / donation.quantityLb) * 100}%` }} /></div><strong>{allocation.quantityLb} lb</strong></div>)}
              <div><span>Supervisor inspection hold</span><div><i className="hold-bar" style={{ width: `${(plan.inspectionHoldLb / donation.quantityLb) * 100}%` }} /></div><strong>{plan.inspectionHoldLb} lb</strong></div>
            </div>
          </Panel>
          <Panel title="Metric assumptions">
            <div className="assumption-list impact-assumptions">
              <p><strong>Household estimate</strong>{plan.metrics.quantityDistributedInTimeLb.toLocaleString()} assigned lb ÷ {scenario.householdWeightLb} lb per household</p>
              <p><strong>Spoilage model</strong>({scenario.baselineExpectedSpoilageLb.toLocaleString()} baseline lb − {plan.metrics.expectedSpoilageLb} expected lb) ÷ {scenario.baselineExpectedSpoilageLb.toLocaleString()}</p>
              <p><strong>Route miles</strong>Sum of precomputed route-leg distances</p>
              <p><strong>Human overrides</strong>{overrideCount} allocation edit{overrideCount === 1 ? "" : "s"} · Approval is not counted as an override</p>
            </div>
          </Panel>
        </div>

        <Panel title="Audit history">
          <div className="table-scroll"><table className="data-table audit-table"><thead><tr><th>Time</th><th>Event</th><th>Actor</th><th>Entity</th><th>Reason or result</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.occurredAt.slice(11, 19)}</td><td><strong>{event.eventType.replaceAll("_", " ")}</strong></td><td>{event.actorType} · {event.actorId}</td><td>{event.entityId}</td><td>{event.reason ?? "Baseline scenario event"}</td></tr>)}</tbody></table></div>
        </Panel>
      </div>
    </>
  );
}
