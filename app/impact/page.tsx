"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gauge, Route, Scale, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { LoadingState } from "@/components/shared/loading-state";
import { Panel } from "@/components/shared/panel";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { donation, scenario } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import { spoilageAvoidancePct, totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { reconcilePlanQuantities } from "@/domain/planning/quantity";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";
import { useDemoState } from "@/state/demo-state";

export default function ImpactPage() {
  const router = useRouter();
  const { state, hydrated, resetScenario } = useDemoState();
  const planSet = useMemo(() => generatePlanSet(), []);
  const original = state.approvedPlan ?? state.planOverrides[state.selectedPlanId] ?? planSet.options.find((option) => option.id === state.selectedPlanId) ?? planSet.options[2];
  const recovered = state.stage === "recovered";
  const plan = recovered ? state.disruption?.recoveryOption ?? createRecoveryOption(original) : original;
  const missionId = recovered ? "MSN-105" : "MSN-104";
  const mission = state.missions[missionId] ?? createMission(plan, missionId);
  const originalMission = state.missions["MSN-104"] ?? createMission(original);
  const reconciliation = reconcilePlanQuantities(plan, donation.quantityLb);
  const spoilagePct = spoilageAvoidancePct(scenario.baselineExpectedSpoilageLb, plan.metrics.expectedSpoilageLb) ?? 0;
  const events = state.auditEvents;
  const overrideCount = events.filter((event) => event.eventType === "plan_allocations_edited").length;
  const affectedQuantityLb = state.disruption?.affectedQuantityLb ?? 0;
  const alternateQuantityLb = plan.allocations.find((allocation) => allocation.destinationId === "PAR-004")?.quantityLb ?? 0;
  const originalMealKitLb = original.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb ?? 0;
  const recoveredMealKitLb = plan.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb ?? originalMealKitLb;

  function restart() {
    resetScenario();
    router.push("/dashboard");
  }

  if (!hydrated) return <LoadingState label="Loading saved impact state…" />;

  if (!state.approvedPlan) {
    return <><PageHeader title="Impact" subtitle="Impact is calculated after human approval." breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Impact" }]} backHref="/dashboard" backLabel="Back to Dashboard" /><div className="route-state"><strong>Impact is calculated after human approval.</strong><span>Approve a feasible plan before reviewing mission outcomes.</span><Link className="button button-primary" href="/plans/PLN-104">Open plan comparison</Link></div></>;
  }

  return (
    <>
      <PageHeader title="Impact" subtitle={`${recovered ? "Recovery route" : "Strawberry Rescue"} · calculated outcome`} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mission", href: `/missions/${missionId}` }, { label: "Impact" }]} backHref={`/missions/${missionId}`} backLabel="Back to Mission" status={<span className="plain-status plain-status-green">Calculated</span>} />
      <div className="page-content impact-page refactor-impact-page">
        <div className="impact-context-banner"><CheckCircle2 size={18} aria-hidden="true" /><span>All primary values are calculated from the approved scenario plan and its audit history.</span></div>
        <section className="impact-metric-grid refactor-impact-metric-grid" aria-label="Primary impact metrics">
          <article className="impact-card impact-blue"><Scale aria-hidden="true" /><span>Pounds offered</span><strong>{donation.quantityLb.toLocaleString()} lb</strong><small>Confirmed donation quantity</small></article>
          <article className="impact-card impact-green"><CheckCircle2 aria-hidden="true" /><span>Delivered before risk deadline</span><strong>{reconciliation.deliveredBeforeRiskLb.toLocaleString()} lb</strong><small>{reconciliation.holdOrLossLb.toLocaleString()} lb held or expected loss</small></article>
          <article className="impact-card impact-purple"><UsersRound aria-hidden="true" /><span>Households supported</span><strong>{plan.metrics.estimatedHouseholdsSupported}</strong><small>{scenario.householdWeightLb} lb conversion assumption</small></article>
          <article className="impact-card impact-green"><Gauge aria-hidden="true" /><span>Modeled spoilage avoided</span><strong>{spoilagePct}%</strong><small>Compared with the seeded baseline</small></article>
        </section>

        {recovered ? <Panel title="Before and after recovery"><div className="before-after-grid"><div><span>Original route</span><strong>Eastside partner · {affectedQuantityLb} lb</strong><small>{totalRouteMiles(originalMission.routeLegs).toFixed(1)} mi · Superseded after disruption</small></div><div className="change-arrow">→</div><div><span>Replacement route</span><strong>Northside {alternateQuantityLb} lb · Kitchen +{recoveredMealKitLb - originalMealKitLb} lb</strong><small>{totalRouteMiles(mission.routeLegs).toFixed(1)} mi · Hard constraints pass</small></div></div></Panel> : null}

        <DetailsAccordion title="View calculation details"><div className="impact-support-grid"><Panel title="Supporting metrics"><div className="impact-support-metrics"><div><Route size={16} aria-hidden="true" /><span>Route miles<strong>{totalRouteMiles(mission.routeLegs).toFixed(1)} mi</strong></span></div><div><Gauge size={16} aria-hidden="true" /><span>Replanning time<strong>{recovered ? `${scenario.modeledReplanningSeconds} sec` : "Not applicable"}</strong></span></div><div><CheckCircle2 size={16} aria-hidden="true" /><span>Quantity reconciliation<strong>{reconciliation.reconciles ? "Pass" : "Review"}</strong></span></div></div></Panel><Panel title="Allocation by destination"><div className="allocation-bars">{plan.allocations.map((allocation) => <div key={allocation.id}><span>{getDestinationName(allocation.destinationId)}</span><div><i style={{ width: `${(allocation.quantityLb / donation.quantityLb) * 100}%` }} /></div><strong>{allocation.quantityLb} lb</strong></div>)}<div><span>Supervisor inspection hold</span><div><i className="hold-bar" style={{ width: `${(plan.inspectionHoldLb / donation.quantityLb) * 100}%` }} /></div><strong>{plan.inspectionHoldLb} lb</strong></div></div></Panel></div><div className="assumption-list impact-assumptions"><p><strong>Household estimate</strong>{reconciliation.deliveredBeforeRiskLb.toLocaleString()} assigned lb ÷ {scenario.householdWeightLb} lb per household</p><p><strong>Spoilage model</strong>({scenario.baselineExpectedSpoilageLb.toLocaleString()} baseline lb − {plan.metrics.expectedSpoilageLb} expected lb) ÷ {scenario.baselineExpectedSpoilageLb.toLocaleString()}</p><p><strong>Human overrides</strong>{overrideCount} allocation edit{overrideCount === 1 ? "" : "s"}; approval is not counted as an override</p></div></DetailsAccordion>

        <DetailsAccordion title="Audit history"><div className="table-scroll"><table className="data-table audit-table"><caption className="sr-only">Decision audit history</caption><thead><tr><th>Time</th><th>Event</th><th>Actor</th><th>Reason or result</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.occurredAt.slice(11, 19)}</td><td><strong>{event.eventType.replaceAll("_", " ")}</strong></td><td>{event.actorType} · {event.actorId}</td><td>{event.reason ?? "Scenario event recorded"}</td></tr>)}</tbody></table></div><DetailsAccordion title="Technical details"><p>Audit event identifiers and seeded fixture references remain available in the source record.</p></DetailsAccordion></DetailsAccordion>

        <StickyActionBar status={<><CheckCircle2 size={19} aria-hidden="true" /><span><strong>Impact calculated</strong><small>Review the supporting calculations or restart the simulated scenario.</small></span></>}><Link className="button button-secondary" href="/dashboard">Return to Dashboard</Link><button className="button button-primary" type="button" onClick={restart}>Restart demo</button></StickyActionBar>
      </div>
    </>
  );
}
