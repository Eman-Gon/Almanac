"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  History,
  Info,
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
import { ProvenanceTag } from "@/components/shared/provenance";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { Tabs } from "@/components/shared/tabs";
import { scoreWeights, SCORE_CONFIG_VERSION } from "@/domain/scoring/destination-score";
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
import type { DestinationScore, PlanOption, PlanSet } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

// The deadline was previously the hardcoded literal "Jul 16 · 10:45 PM" on the decision
// screen, so it would have gone on displaying that after any seed change. AGENTS.md
// rule 8 requires every displayed value be derived.
const deadlineParts = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

function formatDeadline(value: string): string {
  const parts = deadlineParts.formatToParts(new Date(value));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("month")} ${pick("day")} · ${pick("hour")}:${pick("minute")} ${pick("dayPeriod")}`;
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

// The seven weighted inputs, in the order calculateDestinationScore sums them
// (domain/scoring/destination-score.ts:57-64). Stored values are RAW sub-scores; the
// weight is applied at total time, so showing raw × weight lets a reader reproduce the
// arithmetic rather than trust it.
const scoreFactors = [
  { key: "documentedNeed", label: "Documented need" },
  { key: "usabilityMatch", label: "Usability match" },
  { key: "receivingWindowFit", label: "Receiving window fit" },
  { key: "availableCapacity", label: "Available capacity" },
  { key: "recentServiceGap", label: "Recent service gap" },
  { key: "equityPriority", label: "Equity priority" },
  { key: "historicalAcceptance", label: "Historical acceptance" },
] as const;

// Penalties are subtracted un-weighted (destination-score.ts:66-67).
const scorePenalties = [
  { key: "travelPenalty", label: "Travel" },
  { key: "spoilagePenalty", label: "Spoilage" },
  { key: "refusalRiskPenalty", label: "Refusal risk" },
] as const;

function ScoreInspector({ score }: { score: DestinationScore }) {
  return (
    <div className="score-inspector">
      <div className="score-inspector-head">
        <strong>Need-match inputs</strong>
        <span className="score-config-version">weights {SCORE_CONFIG_VERSION} · raw × weight = contribution</span>
      </div>
      <dl className="score-factors">
        {scoreFactors.map(({ key, label }) => (
          <div className="score-factor" key={key}>
            <dt>{label}<span className="score-weight">× {scoreWeights[key]}</span></dt>
            <dd>
              <span className="score-raw">{score[key]}</span>
              <span className="score-contrib">{(score[key] * scoreWeights[key]).toFixed(1)}</span>
            </dd>
          </div>
        ))}
        {scorePenalties.map(({ key, label }) => (
          <div className="score-factor score-factor-penalty" key={key}>
            <dt>{label}<span className="score-weight">penalty</span></dt>
            <dd>
              <span className="score-raw">{score[key]}</span>
              <span className="score-contrib">−{score[key].toFixed(1)}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="score-inspector-total">
        <span>Need-match total<span className="score-weight">clamped to 0–100</span></span>
        <strong>{score.total} / 100</strong>
      </div>
    </div>
  );
}

function AllocationTable({ plan }: { plan: PlanOption }) {
  const validation = validatePlanOption(plan, scenarioValidationContext);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);
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
            <th>Need match</th>
          </tr>
        </thead>
        <tbody>
          {plan.allocations.map((allocation) => {
            const isPartner = allocation.destinationType === "partner" || allocation.destinationType === "packing_program";
            const capacityFits = !validation.issues.some((issue) => issue.entityId === allocation.destinationId);
            return [
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
                <td>
                  <button
                    type="button"
                    className="score-cell"
                    aria-expanded={openScoreId === allocation.id}
                    aria-controls={`score-inspector-${allocation.id}`}
                    onClick={() => setOpenScoreId(openScoreId === allocation.id ? null : allocation.id)}
                  >
                    {allocation.score.total} / 100
                    <ChevronDown size={13} aria-hidden="true" />
                    <span className="sr-only"> — show the inputs behind this score</span>
                  </button>
                </td>
              </tr>,
              openScoreId === allocation.id ? (
                <tr className="score-inspector-row" key={`${allocation.id}-score`} id={`score-inspector-${allocation.id}`}>
                  <td colSpan={7}><ScoreInspector score={allocation.score} /></td>
                </tr>
              ) : null,
            ];
          })}
          {plan.inspectionHoldLb > 0 ? (
            <tr>
              <td><strong>Supervisor inspection hold</strong></td>
              <td className="number-cell">{plan.inspectionHoldLb.toLocaleString()} lb</td>
              <td>Warehouse inspection hold</td>
              <td>Before risk deadline</td>
              <td><span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Within hold limit</span></td>
              <td>Not applicable</td>
              <td>Not scored</td>
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
              <td>Not scored</td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr>
            <th>Total accounted</th>
            <th className="number-cell">{accountedQuantityLb(plan).toLocaleString()} lb</th>
            <td colSpan={5}>{validation.approvable ? "All inventory quantities reconcile" : validation.errors[0]}</td>
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
          {/* Derivation per row is fixed by docs/API_AND_STATE_CONTRACTS.md:95, not by
              preference: the first three rows and household-equivalents are recalculated
              from the current quantities, while miles, staff time, need match, and
              refusal risk stay at their seeded strategy-level values even after a staff
              edit. Without the tag those two kinds of number look identical. */}
          <tr><th>Planned outbound before risk deadline<ProvenanceTag derivation="calculated" /></th>{reconciliations.map(({ option, reconciliation }) => <td key={option.id}>{reconciliation.quantityPlannedOutboundInTimeLb.toLocaleString()} lb</td>)}</tr>
          <tr><th>Retained in long-term storage<ProvenanceTag derivation="calculated" /></th>{reconciliations.map(({ option, reconciliation }) => <td key={option.id}>{reconciliation.retainedLongTermLb.toLocaleString()} lb</td>)}</tr>
          <tr><th>Inspection hold / unallocated<ProvenanceTag derivation="calculated" /></th>{reconciliations.map(({ option, reconciliation }) => <td key={option.id}>{(reconciliation.inspectionHoldLb + reconciliation.unallocatedLb).toLocaleString()} lb</td>)}</tr>
          <tr><th>Total miles<ProvenanceTag derivation="seeded" /></th>{options.map((option) => <td key={option.id}>{option.metrics.totalMiles.toFixed(1)} mi</td>)}</tr>
          <tr><th>Estimated staff time<ProvenanceTag derivation="seeded" /></th>{options.map((option) => <td key={option.id}>{option.metrics.staffMinutes} min</td>)}</tr>
          <tr><th>Modeled household-equivalents<ProvenanceTag derivation="calculated" /></th>{options.map((option) => <td key={option.id}>{option.metrics.modeledHouseholdEquivalents}</td>)}</tr>
          <tr><th>Community need match<ProvenanceTag derivation="seeded" /></th>{options.map((option) => <td key={option.id}>{option.metrics.needMatchScore} / 100</td>)}</tr>
          <tr><th>Refusal risk estimate<ProvenanceTag derivation="seeded" /></th>{options.map((option) => <td key={option.id}>{option.metrics.refusalRiskScore} / 100</td>)}</tr>
        </tbody>
      </table>
      <div className="guardrail-note">
        <Info size={18} aria-hidden="true" />
        <div>
          <strong>Seeded rows do not move when you edit quantities</strong>
          <span>Dashed rows are strategy-level scenario estimates. Editing an allocation recalculates the solid rows only; miles, staff time, need match, and refusal risk keep their seeded values.</span>
        </div>
      </div>
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
          {/* Constraint: at-risk inventory has a clock on it, and urgency has to read
              peripherally. This sat as the first of five identical facts. There is no
              seeded "now" in the scenario, so this encodes the lot's seeded riskLevel —
              not a computed countdown, which would also make the demo non-deterministic. */}
          <div className={`decision-summary-deadline risk-${productLot.riskLevel}`}>
            <Clock3 aria-hidden="true" />
            <span>Risk deadline<strong>{formatDeadline(productLot.riskDeadline)}</strong></span>
            <span className="deadline-risk-tag">{productLot.riskLevel} risk</span>
          </div>
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
