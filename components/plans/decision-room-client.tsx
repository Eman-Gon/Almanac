"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Snowflake, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ApprovalDialog } from "@/components/plans/approval-dialog";
import { PlanCard } from "@/components/plans/plan-card";
import { QuantityEditorDialog } from "@/components/plans/quantity-editor-dialog";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { DetailsDrawer } from "@/components/shared/details-drawer";
import { NetworkMap } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { Tabs } from "@/components/shared/tabs";
import { donation, scenario, vehicles, warehouse } from "@/data/seed/scenario";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { accountedQuantityLb, reconcilePlanQuantities, validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import type { PlanOption } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";

function arrivalWindow(destinationId: string): string {
  if (destinationId === "PAR-001") return "9:30 AM – 12:00 PM";
  if (destinationId === "PAR-002") return "10:00 AM – 12:30 PM";
  if (destinationId === "PAR-003") return "9:30 AM – 1:00 PM";
  return "Before 1:00 PM";
}

function handlingLabel(handling: PlanOption["allocations"][number]["handling"]): string {
  return {
    store: "Refrigerated storage",
    cross_dock: "Direct delivery",
    pack: "Refrigerated staging",
    inspect: "Inspection hold",
    redirect: "External redirect",
  }[handling];
}

function WhyThisPlan({ plan, validation }: { plan: PlanOption; validation: ReturnType<typeof validatePlanOption> }) {
  const bullets = plan.strategy === "mixed"
    ? [
        "Best community-need match while staying within cold capacity.",
        "1,140 lb is delivered before the risk deadline.",
        "60 lb remains in supervisor inspection hold for human review.",
      ]
    : [
        validation.displayMessage ?? "The plan satisfies the current hard constraints.",
        ...plan.risks.filter((risk) => !risk.blocking).slice(0, 2).map((risk) => risk.message),
      ].slice(0, 3);

  return <ul className="why-plan-list">{bullets.map((bullet, index) => <li key={`${bullet}-${index}`}><CheckCircle2 size={15} aria-hidden="true" /><span>{bullet}</span></li>)}</ul>;
}

function AllocationTable({ plan }: { plan: PlanOption }) {
  const validation = validatePlanOption(plan, scenarioValidationContext);
  return (
    <div className="table-scroll">
      <table className="data-table allocation-table">
        <caption className="sr-only">{plan.name} allocation details</caption>
        <thead><tr><th>Destination</th><th>Quantity</th><th>Handling</th><th>Receiving window</th><th>Capacity result</th><th>Community need match</th></tr></thead>
        <tbody>
          {plan.allocations.map((allocation) => {
            const capacityFits = !validation.issues.some((issue) => issue.entityId === allocation.destinationId);
            return <tr key={allocation.id}><td>{allocation.destinationType === "partner" || allocation.destinationType === "packing_program" ? <Link href={`/partners/${allocation.destinationId}`}><strong>{getDestinationName(allocation.destinationId)}</strong></Link> : <strong>{getDestinationName(allocation.destinationId)}</strong>}</td><td className="number-cell">{allocation.quantityLb.toLocaleString()} lb</td><td>{handlingLabel(allocation.handling)}</td><td>{arrivalWindow(allocation.destinationId)}</td><td>{capacityFits ? <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Within capacity</span> : <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Over capacity</span>}</td><td>{allocation.score.total} / 100</td></tr>;
          })}
          {plan.inspectionHoldLb > 0 ? <tr><td><strong>Supervisor inspection hold</strong></td><td className="number-cell">{plan.inspectionHoldLb.toLocaleString()} lb</td><td>Inspection hold</td><td>By 1:00 PM</td><td><span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Within capacity</span></td><td>—</td></tr> : null}
        </tbody>
        <tfoot><tr><th>Total accounted</th><th className="number-cell">{accountedQuantityLb(plan).toLocaleString()} lb</th><td colSpan={4}>{validation.approvable ? "All quantities reconcile" : validation.errors[0]}</td></tr></tfoot>
      </table>
    </div>
  );
}

function ComparisonTable({ options }: { options: PlanOption[] }) {
  return <div className="table-scroll"><table className="data-table comparison-table"><caption className="sr-only">Plan metric comparison</caption><thead><tr><th>Metric</th>{options.map((option) => <th key={option.id}>{option.name}</th>)}</tr></thead><tbody>
    <tr><th>Delivered before risk deadline</th>{options.map((option) => <td key={option.id}>{reconcilePlanQuantities(option, donation.quantityLb).deliveredBeforeRiskLb.toLocaleString()} lb</td>)}</tr>
    <tr><th>Inspection hold or expected loss</th>{options.map((option) => <td key={option.id}>{reconcilePlanQuantities(option, donation.quantityLb).holdOrLossLb.toLocaleString()} lb</td>)}</tr>
    <tr><th>Total miles</th>{options.map((option) => <td key={option.id}>{option.metrics.totalMiles.toFixed(1)} mi</td>)}</tr>
    <tr><th>Estimated staff time</th>{options.map((option) => <td key={option.id}>{option.metrics.staffMinutes} min</td>)}</tr>
    <tr><th>Community need match</th>{options.map((option) => <td key={option.id}>{option.metrics.needMatchScore} / 100</td>)}</tr>
    <tr><th>Refusal risk estimate</th>{options.map((option) => <td key={option.id}>{option.metrics.refusalRiskScore} / 100</td>)}</tr>
  </tbody></table></div>;
}

export function DecisionRoomClient() {
  const router = useRouter();
  const { state, selectPlan, editPlan, approvePlan } = useDemoState();
  const [planSet] = useState(generatePlanSet);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<PlanOption | null>(null);
  const options = useMemo(() => planSet.options.map((option) => state.planOverrides[option.id] ?? option), [planSet.options, state.planOverrides]);
  const selectedPlan = useMemo(() => state.approvedPlan ?? options.find((option) => option.id === state.selectedPlanId) ?? options[2], [options, state.approvedPlan, state.selectedPlanId]);
  const validation = validatePlanOption(selectedPlan, scenarioValidationContext);
  const selectedReconciliation = reconcilePlanQuantities(selectedPlan, donation.quantityLb);

  function completeApproval(reason: string) {
    if (!validation.approvable) return;
    approvePlan(selectedPlan, reason);
    router.push("/packing/PKG-104");
  }

  const detailContent = detailsPlan ? (
    <div className="plan-detail-drawer-content">
      <span className="plan-status feasible">{detailsPlan.name}</span>
      <h3>Why it was scored this way</h3>
      <dl className="drawer-facts">
        <div><dt>Community need match</dt><dd>{detailsPlan.metrics.needMatchScore} / 100</dd></div>
        <div><dt>Equity estimate</dt><dd>{detailsPlan.metrics.equityIndicator} / 100</dd></div>
        <div><dt>Refusal-risk estimate</dt><dd>{detailsPlan.metrics.refusalRiskScore} / 100</dd></div>
        <div><dt>Cold-capacity use</dt><dd>{detailsPlan.metrics.coldCapacityUtilizationPct > 100 ? "Over capacity" : detailsPlan.metrics.coldCapacityUtilizationPct >= 80 ? "Near capacity" : "Within capacity"}</dd></div>
      </dl>
      <h3>Operational risks</h3>
      <ul className="drawer-list">{detailsPlan.risks.map((risk) => <li key={risk.code}><strong>{risk.level === "critical" ? "Blocking" : "Watch"}</strong><span>{risk.message}</span></li>)}</ul>
      <DetailsAccordion title="Technical details"><p>Plan option {detailsPlan.id} · score configuration {scenario.scoreConfigVersion}.</p><p>All quantities, capacities, windows, routes, and scores are calculated by deterministic scenario services.</p></DetailsAccordion>
    </div>
  ) : null;

  return (
    <>
      <PageHeader title="Plan comparison" subtitle="Choose the most workable route for the strawberry offer." breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Donations", href: "/donations/DON-104" }, { label: "DON-104", href: "/donations/DON-104" }, { label: "Plans" }]} backHref="/donations/DON-104" backLabel="Back to donation" />
      <div className="page-content decision-room-page refactor-decision-room">
        <section className="decision-summary refactor-decision-summary" aria-label="Decision constraints">
          <div><Clock3 aria-hidden="true" /><span>Pickup before<strong>1:00 PM</strong></span></div>
          <div><Snowflake aria-hidden="true" /><span>Cold storage<strong>{warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb} lb available</strong></span></div>
          <div><Snowflake aria-hidden="true" /><span>Cold staging<strong>{warehouse.refrigeratedStagingCapacityAvailableLb} lb available</strong></span></div>
          <div><Truck aria-hidden="true" /><span>Vehicle capacity<strong>{vehicles[0].capacityLb.toLocaleString()} lb</strong></span></div>
          <div><CheckCircle2 aria-hidden="true" /><span>Offer accounted<strong>{accountedQuantityLb(selectedPlan).toLocaleString()} / {donation.quantityLb.toLocaleString()} lb</strong></span></div>
        </section>

        <section className="plan-card-grid refactor-plan-card-grid" aria-label="Plan alternatives">
          {options.map((plan) => <PlanCard key={plan.id} plan={plan} selected={selectedPlan.id === plan.id} disabled={Boolean(state.approvedPlan)} onSelect={() => selectPlan(plan.id)} onViewDetails={() => setDetailsPlan(plan)} />)}
        </section>

        <StickyActionBar className={`decision-approval-rail ${validation.approvable ? "" : "rail-invalid"}`} status={<><span className="sticky-status-icon">{validation.approvable ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}</span><span><strong>{selectedPlan.name}</strong><small>{validation.approvable && selectedReconciliation.reconciles ? "All quantities reconcile · Human approval required" : validation.errors[0]}</small></span></>}>
          <span className="approver-label"><span>Approver</span><strong>demo_user</strong></span>
          <button className="button button-secondary" type="button" onClick={() => setEditorOpen(true)} disabled={selectedPlan.strategy === "warehouse_first" || Boolean(state.approvedPlan)}>Edit quantities</button>
          <button className="button button-primary" type="button" disabled={!state.approvedPlan && !validation.approvable} onClick={() => state.approvedPlan ? router.push("/packing/PKG-104") : setApprovalOpen(true)}>{state.approvedPlan ? "Open packing plan" : "Review and approve"}<ExternalLink size={16} aria-hidden="true" /></button>
        </StickyActionBar>

        <Tabs items={[
          { id: "overview", label: "Overview", content: <div className="decision-overview-grid"><Panel title="Why this plan"><WhyThisPlan plan={selectedPlan} validation={validation} /></Panel><Panel title="Route preview" action={<Link className="panel-link" href={`/map?plan=${selectedPlan.planSetId}&returnTo=/plans/${selectedPlan.planSetId}`}>Open route map <ExternalLink size={13} aria-hidden="true" /></Link>}><div className="route-preview-map"><NetworkMap showList={false} /></div></Panel><div className={`decision-warning ${validation.approvable ? "decision-warning-ok" : "decision-warning-blocking"}`}>{validation.approvable ? <CheckCircle2 size={17} aria-hidden="true" /> : <AlertTriangle size={17} aria-hidden="true" />}<span><strong>{validation.approvable ? "Ready for human approval" : "Approval blocked"}</strong><small>{validation.approvable ? "The selected option passes quantity and capacity checks." : validation.errors[0]}</small></span></div></div> },
          { id: "allocations", label: "Allocations", content: <Panel title={`${selectedPlan.name} allocations`} className="tab-panel-panel"><AllocationTable plan={selectedPlan} /></Panel> },
          { id: "comparison", label: "Comparison", content: <Panel title="Plan comparison matrix" className="tab-panel-panel"><ComparisonTable options={options} /></Panel> },
          { id: "assumptions", label: "Assumptions", content: <Panel title="Assumptions and exclusions" className="tab-panel-panel"><div className="assumption-list">{selectedPlan.assumptions.map((assumption) => <p key={assumption}>{assumption}</p>)}{selectedPlan.excludedDestinations.map((exclusion) => <p className="exclusion" key={exclusion.destinationId}><strong>{getDestinationName(exclusion.destinationId)}</strong>{exclusion.reason}</p>)}</div><DetailsAccordion title="Technical details"><p>Score methodology: {scenario.scoreConfigVersion}. Community need, equity, refusal risk, travel, spoilage, capacity, and receiving windows remain inspectable.</p><p>Plan option ID: {selectedPlan.id} · Plan set: {selectedPlan.planSetId}.</p></DetailsAccordion></Panel> },
        ]} />
      </div>
      <DetailsDrawer open={Boolean(detailsPlan)} title="Plan details" onClose={() => setDetailsPlan(null)}>{detailContent}</DetailsDrawer>
      <ApprovalDialog open={approvalOpen} plan={selectedPlan} onClose={() => setApprovalOpen(false)} onApprove={completeApproval} />
      <QuantityEditorDialog open={editorOpen} plan={selectedPlan} onClose={() => setEditorOpen(false)} onApply={(updated, reason) => editPlan(updated, reason)} />
    </>
  );
}
