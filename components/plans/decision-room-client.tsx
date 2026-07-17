"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  Snowflake,
  Truck,
} from "lucide-react";
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
import {
  partners,
  productLot,
  scenario,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import {
  accountedQuantityLb,
  reconcilePlanQuantities,
  validatePlanOption,
} from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import type { PlanOption, PlanSet } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function arrivalWindow(destinationId: string): string {
  if (destinationId === warehouse.id) {
    const window = warehouse.dockWindows[0];
    return window ? `${formatTime(window.start)} – ${formatTime(window.end)}` : "Window unknown";
  }
  const window = partners.find((partner) => partner.id === destinationId)?.receivingWindows[0];
  return window ? `${formatTime(window.start)} – ${formatTime(window.end)}` : "Window unknown";
}

function handlingLabel(handling: PlanOption["allocations"][number]["handling"]): string {
  return {
    store: "Long-term refrigerated hold",
    cross_dock: "Outbound agency delivery",
    pack: "Refrigerated program staging",
    inspect: "Inspection hold",
    redirect: "External transfer",
  }[handling];
}

function acceptanceEvidence(destinationId: string): string {
  const partner = partners.find((candidate) => candidate.id === destinationId);
  const history = partner?.acceptanceHistory.find((candidate) => candidate.category === productLot.category);
  if (!history) return "Unknown · no category sample";
  return `${history.acceptanceRatePct}% full acceptance · ${history.acceptedCount} accepted / ${history.refusedCount} refused / ${history.shortReceiptCount} short · n=${history.sampleSize}`;
}

function WhyThisPlan({
  plan,
  validation,
}: {
  plan: PlanOption;
  validation: ReturnType<typeof validatePlanOption>;
}) {
  const bullets = plan.strategy === "balanced_release"
    ? [
        "Best seeded balance of documented need, route distance, and current receiving constraints.",
        `${plan.metrics.quantityPlannedOutboundInTimeLb.toLocaleString()} lb is planned outbound before the risk deadline.`,
        `${plan.inspectionHoldLb.toLocaleString()} lb remains in a supervisor inspection hold; staff release is still required.`,
      ]
    : [
        validation.displayMessage ?? "The plan satisfies the current hard constraints.",
        ...plan.risks.filter((risk) => !risk.blocking).slice(0, 2).map((risk) => risk.message),
      ].slice(0, 3);

  return (
    <ul className="why-plan-list">
      {bullets.map((bullet, index) => (
        <li key={`${bullet}-${index}`}>
          <CheckCircle2 size={15} aria-hidden="true" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

function AllocationTable({ plan }: { plan: PlanOption }) {
  const validation = validatePlanOption(plan, scenarioValidationContext);
  return (
    <div className="table-scroll">
      <table className="data-table allocation-table">
        <caption className="sr-only">{plan.name} outbound allocation details</caption>
        <thead>
          <tr>
            <th>Destination</th>
            <th>Quantity</th>
            <th>Outbound handling</th>
            <th>Receiving window</th>
            <th>Capacity result</th>
            <th>Historical produce acceptance</th>
          </tr>
        </thead>
        <tbody>
          {plan.allocations.map((allocation) => {
            const isPartner = allocation.destinationType === "partner" || allocation.destinationType === "packing_program";
            const capacityFits = !validation.issues.some((issue) => issue.entityId === allocation.destinationId);
            return (
              <tr key={allocation.id}>
                <td>
                  {isPartner ? (
                    <Link href={`/partners/${allocation.destinationId}`}><strong>{getDestinationName(allocation.destinationId)}</strong></Link>
                  ) : (
                    <strong>{getDestinationName(allocation.destinationId)}</strong>
                  )}
                </td>
                <td className="number-cell">{allocation.quantityLb.toLocaleString()} lb</td>
                <td>{handlingLabel(allocation.handling)}</td>
                <td>{arrivalWindow(allocation.destinationId)}</td>
                <td>
                  {capacityFits ? (
                    <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Within capacity</span>
                  ) : (
                    <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Over capacity</span>
                  )}
                </td>
                <td>{isPartner ? acceptanceEvidence(allocation.destinationId) : "Not applicable"}</td>
              </tr>
            );
          })}
          {plan.inspectionHoldLb > 0 ? (
            <tr>
              <td><strong>Supervisor inspection hold</strong></td>
              <td className="number-cell">{plan.inspectionHoldLb.toLocaleString()} lb</td>
              <td>Warehouse inspection hold</td>
              <td>Before risk deadline</td>
              <td><span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Within hold limit</span></td>
              <td>Not applicable</td>
            </tr>
          ) : null}
          {plan.unallocatedLb > 0 ? (
            <tr>
              <td><strong>Unallocated inventory</strong></td>
              <td className="number-cell">{plan.unallocatedLb.toLocaleString()} lb</td>
              <td>Requires staff decision</td>
              <td>Before risk deadline</td>
              <td><span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Review required</span></td>
              <td>Not applicable</td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr>
            <th>Total accounted</th>
            <th className="number-cell">{accountedQuantityLb(plan).toLocaleString()} lb</th>
            <td colSpan={4}>{validation.approvable ? "All inventory quantities reconcile" : validation.errors[0]}</td>
          </tr>
        </tfoot>
      </table>
      <div className="guardrail-note">
        <History size={18} aria-hidden="true" />
        <div>
          <strong>Historical acceptance is explanatory only</strong>
          <span>Full acceptances, refusals, short receipts, and sample size are synthetic. Current capacity, status, and receiving windows remain authoritative.</span>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable({ options }: { options: PlanOption[] }) {
  const reconciliations = options.map((option) => ({
    option,
    reconciliation: reconcilePlanQuantities(option, productLot.availableQuantityLb),
  }));
  return (
    <div className="table-scroll">
      <table className="data-table comparison-table">
        <caption className="sr-only">Outbound plan metric comparison</caption>
        <thead><tr><th>Metric</th>{options.map((option) => <th key={option.id}>{option.name}</th>)}</tr></thead>
        <tbody>
          <tr><th>Planned outbound before risk deadline</th>{reconciliations.map(({ option, reconciliation }) => <td key={option.id}>{reconciliation.quantityPlannedOutboundInTimeLb.toLocaleString()} lb</td>)}</tr>
          <tr><th>Retained in long-term storage</th>{reconciliations.map(({ option, reconciliation }) => <td key={option.id}>{reconciliation.retainedLongTermLb.toLocaleString()} lb</td>)}</tr>
          <tr><th>Inspection hold / unallocated</th>{reconciliations.map(({ option, reconciliation }) => <td key={option.id}>{(reconciliation.inspectionHoldLb + reconciliation.unallocatedLb).toLocaleString()} lb</td>)}</tr>
          <tr><th>Total miles</th>{options.map((option) => <td key={option.id}>{option.metrics.totalMiles.toFixed(1)} mi</td>)}</tr>
          <tr><th>Estimated staff time</th>{options.map((option) => <td key={option.id}>{option.metrics.staffMinutes} min</td>)}</tr>
          <tr><th>Modeled household-equivalents</th>{options.map((option) => <td key={option.id}>{option.metrics.modeledHouseholdEquivalents}</td>)}</tr>
          <tr><th>Community need match</th>{options.map((option) => <td key={option.id}>{option.metrics.needMatchScore} / 100</td>)}</tr>
          <tr><th>Refusal risk estimate</th>{options.map((option) => <td key={option.id}>{option.metrics.refusalRiskScore} / 100</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}

export function DecisionRoomClient({
  planSet: providedPlanSet,
  loading = false,
  errorMessage = null,
}: {
  planSet?: PlanSet | null;
  loading?: boolean;
  errorMessage?: string | null;
} = {}) {
  const router = useRouter();
  const { state, selectPlan, editPlan, approvePlan } = useDemoState();
  const [planSet] = useState<PlanSet | null>(() =>
    providedPlanSet === undefined ? generatePlanSet() : providedPlanSet,
  );
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<PlanOption | null>(null);
  const options = useMemo(
    () => (planSet?.options ?? []).map((option) => state.planOverrides[option.id] ?? option),
    [planSet, state.planOverrides],
  );
  const resolvedPlan = useMemo<PlanOption | null>(
    () => state.approvedPlan ?? options.find((option) => option.id === state.selectedPlanId) ?? options[2] ?? null,
    [options, state.approvedPlan, state.selectedPlanId],
  );

  if (loading) return <div className="route-state" role="status"><strong>Loading plan alternatives…</strong></div>;
  if (errorMessage) return <div className="route-state" role="alert"><strong>Plan alternatives could not be loaded.</strong><span>{errorMessage}</span></div>;
  if (!resolvedPlan) return <div className="route-state"><strong>No plan alternatives are available.</strong><span>Return to the inventory lot and generate plans before approval.</span></div>;

  const selectedPlan = resolvedPlan;
  const validation = validatePlanOption(selectedPlan, scenarioValidationContext);
  const selectedReconciliation = reconcilePlanQuantities(selectedPlan, productLot.availableQuantityLb);
  const routeLocationIds = [
    warehouse.id,
    ...selectedPlan.allocations
      .filter((allocation) => allocation.destinationType !== "warehouse")
      .map((allocation) => allocation.destinationId),
  ];

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
        <div><dt>Planned outbound</dt><dd>{detailsPlan.metrics.quantityPlannedOutboundInTimeLb.toLocaleString()} lb</dd></div>
        <div><dt>Community need match</dt><dd>{detailsPlan.metrics.needMatchScore} / 100</dd></div>
        <div><dt>Equity estimate</dt><dd>{detailsPlan.metrics.equityIndicator} / 100</dd></div>
        <div><dt>Refusal-risk estimate</dt><dd>{detailsPlan.metrics.refusalRiskScore} / 100</dd></div>
        <div><dt>Long-term cold use</dt><dd>{detailsPlan.metrics.coldCapacityUtilizationPct > 100 ? "Over capacity" : detailsPlan.metrics.coldCapacityUtilizationPct >= 80 ? "Near capacity" : "Within capacity"}</dd></div>
      </dl>
      <h3>Operational risks</h3>
      <ul className="drawer-list">
        {detailsPlan.risks.map((risk) => (
          <li key={risk.code}><strong>{risk.blocking ? "Blocking" : "Watch"}</strong><span>{risk.message}</span></li>
        ))}
      </ul>
      <DetailsAccordion title="Technical details">
        <p>Plan option {detailsPlan.id} · score configuration {scenario.scoreConfigVersion}.</p>
        <p>Quantities, capacities, windows, seeded routes, and metrics are deterministic. Historical acceptance contributes only to explanation and ranking.</p>
      </DetailsAccordion>
    </div>
  ) : null;

  return (
    <>
      <PageHeader
        title="Outbound plan comparison"
        subtitle="Compare explainable release plans for existing warehouse inventory."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: `/inventory/${productLot.id}` },
          { label: productLot.id, href: `/inventory/${productLot.id}` },
          { label: "Plans" },
        ]}
        backHref={`/inventory/${productLot.id}`}
        backLabel="Back to inventory lot"
      />
      <div className="page-content decision-room-page refactor-decision-room">
        <section className="decision-summary refactor-decision-summary" aria-label="Decision constraints">
          <div><Clock3 aria-hidden="true" /><span>Risk deadline<strong>Jul 16 · 10:45 PM</strong></span></div>
          <div><Snowflake aria-hidden="true" /><span>Long-term cold headroom<strong>{warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb} lb available</strong></span></div>
          <div><Snowflake aria-hidden="true" /><span>Short-dwell cold staging<strong>{warehouse.refrigeratedStagingCapacityAvailableLb} lb available</strong></span></div>
          <div><Truck aria-hidden="true" /><span>Refrigerated vehicle capacity<strong>{vehicles[0].capacityLb.toLocaleString()} lb</strong></span></div>
          <div><CheckCircle2 aria-hidden="true" /><span>Available inventory accounted<strong>{accountedQuantityLb(selectedPlan).toLocaleString()} / {productLot.availableQuantityLb.toLocaleString()} lb</strong></span></div>
        </section>

        <section className="plan-card-grid refactor-plan-card-grid" aria-label="Outbound plan alternatives">
          {options.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan.id === plan.id}
              disabled={Boolean(state.approvedPlan)}
              onSelect={() => selectPlan(plan.id)}
              onViewDetails={() => setDetailsPlan(plan)}
            />
          ))}
        </section>

        <StickyActionBar
          className={`decision-approval-rail ${validation.approvable ? "" : "rail-invalid"}`}
          status={(
            <>
              <span className="sticky-status-icon">
                {validation.approvable ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}
              </span>
              <span>
                <strong>{selectedPlan.name}</strong>
                <small>{validation.approvable && selectedReconciliation.reconciles ? "All inventory quantities reconcile · Human approval required" : validation.errors[0]}</small>
              </span>
            </>
          )}
        >
          <span className="approver-label"><span>Approver</span><strong>demo_user</strong></span>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setEditorOpen(true)}
            disabled={selectedPlan.strategy === "hold_for_later" || Boolean(state.approvedPlan)}
          >
            Edit quantities
          </button>
          <button
            className="button button-primary"
            type="button"
            disabled={!state.approvedPlan && !validation.approvable}
            onClick={() => state.approvedPlan ? router.push("/packing/PKG-104") : setApprovalOpen(true)}
          >
            {state.approvedPlan ? "Open packing plan" : "Review and approve"}<ExternalLink size={16} aria-hidden="true" />
          </button>
        </StickyActionBar>

        <Tabs items={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="decision-overview-grid">
                <Panel title="Why this plan"><WhyThisPlan plan={selectedPlan} validation={validation} /></Panel>
                <Panel
                  title="Warehouse-origin route preview"
                  action={<Link className="panel-link" href={`/map?plan=${selectedPlan.planSetId}&returnTo=/plans/${selectedPlan.planSetId}`}>Open route map <ExternalLink size={13} aria-hidden="true" /></Link>}
                >
                  <div className="route-preview-map"><NetworkMap showList={false} routeLocationIds={routeLocationIds} /></div>
                </Panel>
                <div className={`decision-warning ${validation.approvable ? "decision-warning-ok" : "decision-warning-blocking"}`}>
                  {validation.approvable ? <CheckCircle2 size={17} aria-hidden="true" /> : <AlertTriangle size={17} aria-hidden="true" />}
                  <span>
                    <strong>{validation.approvable ? "Ready for human approval" : "Approval blocked"}</strong>
                    <small>{validation.approvable ? "The selected option passes quantity and capacity checks." : validation.errors[0]}</small>
                  </span>
                </div>
              </div>
            ),
          },
          { id: "allocations", label: "Allocations", content: <Panel title={`${selectedPlan.name} outbound allocations`} className="tab-panel-panel"><AllocationTable plan={selectedPlan} /></Panel> },
          { id: "comparison", label: "Comparison", content: <Panel title="Outbound plan comparison matrix" className="tab-panel-panel"><ComparisonTable options={options} /></Panel> },
          {
            id: "assumptions",
            label: "Assumptions",
            content: (
              <Panel title="Assumptions and exclusions" className="tab-panel-panel">
                <div className="assumption-list">
                  {selectedPlan.assumptions.map((assumption) => <p key={assumption}>{assumption}</p>)}
                  {selectedPlan.excludedDestinations.map((exclusion) => (
                    <p className="exclusion" key={exclusion.destinationId}><strong>{getDestinationName(exclusion.destinationId)}</strong>{exclusion.reason}</p>
                  ))}
                </div>
                <DetailsAccordion title="Technical details">
                  <p>Score methodology: {scenario.scoreConfigVersion}. Need, equity, refusal risk, historical acceptance, travel, spoilage, capacity, and receiving windows remain inspectable.</p>
                  <p>Plan option ID: {selectedPlan.id} · Plan set: {selectedPlan.planSetId} · Inventory lot: {productLot.id}.</p>
                </DetailsAccordion>
              </Panel>
            ),
          },
        ]} />
      </div>

      <DetailsDrawer open={Boolean(detailsPlan)} title="Plan details" onClose={() => setDetailsPlan(null)}>{detailContent}</DetailsDrawer>
      <ApprovalDialog open={approvalOpen} plan={selectedPlan} onClose={() => setApprovalOpen(false)} onApprove={completeApproval} />
      <QuantityEditorDialog open={editorOpen} plan={selectedPlan} onClose={() => setEditorOpen(false)} onApply={(updated, reason) => editPlan(updated, reason)} />
    </>
  );
}
