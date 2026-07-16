"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Snowflake,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ApprovalDialog } from "@/components/plans/approval-dialog";
import { PlanCard } from "@/components/plans/plan-card";
import { QuantityEditorDialog } from "@/components/plans/quantity-editor-dialog";
import { NetworkMap } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { vehicles, warehouse } from "@/data/seed/scenario";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { accountedQuantityLb, validatePlanOption } from "@/domain/planning/quantity";
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
  const labels = {
    store: "Refrigerated storage",
    cross_dock: "Direct delivery",
    pack: "Refrigerated staging",
    inspect: "Inspection hold",
    redirect: "External redirect",
  } as const;
  return labels[handling];
}

export function DecisionRoomClient() {
  const router = useRouter();
  const { state, selectPlan, editPlan, approvePlan } = useDemoState();
  const [planSet] = useState(generatePlanSet);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const options = useMemo(
    () =>
      planSet.options.map(
        (option) => state.planOverrides[option.id] ?? option,
      ),
    [planSet.options, state.planOverrides],
  );

  const selectedPlan = useMemo(
    () => state.approvedPlan ?? options.find((option) => option.id === state.selectedPlanId) ?? options[2],
    [options, state.approvedPlan, state.selectedPlanId],
  );
  const validation = validatePlanOption(selectedPlan, scenarioValidationContext);

  function applyEdit(updated: PlanOption, reason: string) {
    editPlan(updated, reason);
  }

  function completeApproval(reason: string) {
    approvePlan(selectedPlan, reason);
    router.push("/packing/PKG-104");
  }

  const selectedName = selectedPlan.name;

  return (
    <>
      <PageHeader
        title="AI Decision Room"
        subtitle="DON-104 · 1,200 lb strawberries"
        actions={<Link className="button button-ghost" href="/donations/DON-104"><ArrowLeft size={16} aria-hidden="true" />Back to donation</Link>}
      />
      <div className="page-content decision-room-page">
        <section className="decision-summary" aria-label="Decision constraints">
          <div><Clock3 className="summary-red" aria-hidden="true" /><span>Pickup before<strong>1:00 PM</strong></span></div>
          <div><Snowflake className="summary-blue" aria-hidden="true" /><span>Cold space available<strong>{warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb} lb storage · {warehouse.refrigeratedStagingCapacityAvailableLb} lb staging</strong></span></div>
          <div><Truck className="summary-green" aria-hidden="true" /><span>Refrigerated vehicle capacity<strong>{vehicles[0].capacityLb.toLocaleString()} lb</strong></span></div>
          <div><CheckCircle2 className="summary-green" aria-hidden="true" /><span><strong>{accountedQuantityLb(selectedPlan).toLocaleString()} lb</strong>accounted for</span></div>
        </section>

        <section className="plan-card-grid" aria-label="Plan alternatives">
          {options.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan.id === plan.id}
              disabled={Boolean(state.approvedPlan)}
              onSelect={() => selectPlan(plan.id)}
            />
          ))}
        </section>

        <div className="decision-work-grid">
          <Panel title={`${selectedName} allocations`} className="allocation-panel">
            <div className="table-scroll">
              <table className="data-table allocation-table">
                <thead><tr><th>Location</th><th>Allocation</th><th>Handling</th><th>Arrival window</th><th>Capacity fit</th><th>Score</th></tr></thead>
                <tbody>
                  {selectedPlan.allocations.map((allocation) => {
                    const capacityFits = !validation.issues.some(
                      (issue) => issue.entityId === allocation.destinationId,
                    );
                    return (
                      <tr key={allocation.id}>
                        <td>
                          {allocation.destinationType === "partner" || allocation.destinationType === "packing_program" ? (
                            <Link href={`/partners/${allocation.destinationId}`}><span className="table-location-icon" />{getDestinationName(allocation.destinationId)}</Link>
                          ) : (
                            <span><span className="table-location-icon" />{getDestinationName(allocation.destinationId)}</span>
                          )}
                        </td>
                        <td className="number-cell"><strong>{allocation.quantityLb.toLocaleString()} lb</strong></td>
                        <td>{handlingLabel(allocation.handling)}</td>
                        <td>{arrivalWindow(allocation.destinationId)}</td>
                        <td>{capacityFits ? <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Fits</span> : <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Exceeds</span>}</td>
                        <td>{allocation.score.total} / 100</td>
                      </tr>
                    );
                  })}
                  {selectedPlan.inspectionHoldLb > 0 ? (
                    <tr>
                      <td><span className="table-location-icon hold" />Supervisor inspection hold</td>
                      <td className="number-cell"><strong>{selectedPlan.inspectionHoldLb} lb</strong></td>
                      <td>Inspection hold</td><td>By 1:00 PM</td><td>{validation.capacity.warehouseStorage.excessQuantityLb === 0 ? <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Fits storage</span> : <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Exceeds</span>}</td><td>—</td>
                    </tr>
                  ) : null}
                </tbody>
                <tfoot><tr><th>Total</th><th className="number-cell">{accountedQuantityLb(selectedPlan).toLocaleString()} lb</th><td colSpan={4}>{validation.approvable ? "All quantities reconcile" : "Plan has blocking validation errors"}</td></tr></tfoot>
              </table>
            </div>
          </Panel>

          <div className="decision-side-stack">
            <Panel title="Route overview" action={<Link className="panel-link" href="/map">View full map <ExternalLink size={13} aria-hidden="true" /></Link>}>
              <NetworkMap showList={false} />
            </Panel>
            <Panel title="Why this plan" className="why-panel">
              {selectedPlan.strategy === "mixed" ? (
                <ul>
                  <li><CheckCircle2 aria-hidden="true" />Maximizes need match while staying within cold capacity.</li>
                  <li><Clock3 aria-hidden="true" />All deliveries arrive before the 1:00 PM pickup deadline.</li>
                  <li><Snowflake aria-hidden="true" />Keeps 60 lb in supervisor inspection hold.</li>
                </ul>
              ) : (
                <ul>
                  {selectedPlan.risks.map((risk) => <li key={risk.code}><AlertTriangle aria-hidden="true" />{risk.message}</li>)}
                  <li><CheckCircle2 aria-hidden="true" />Every score component and assumption remains inspectable.</li>
                </ul>
              )}
              <a href="#plan-details">View assumptions and exclusions</a>
            </Panel>
          </div>
        </div>

        <div className="plan-details-grid" id="plan-details">
          <Panel title="Metric comparison">
            <div className="table-scroll">
              <table className="data-table comparison-table">
                <thead><tr><th>Metric</th>{options.map((option) => <th key={option.id}>{option.name}</th>)}</tr></thead>
                <tbody>
                  <tr><th>Distributed before risk deadline</th>{options.map((option) => <td key={option.id}>{option.metrics.quantityDistributedInTimeLb.toLocaleString()} lb</td>)}</tr>
                  <tr><th>Expected inspection hold / loss</th>{options.map((option) => <td key={option.id}>{option.metrics.expectedSpoilageLb} lb</td>)}</tr>
                  <tr><th>Total miles</th>{options.map((option) => <td key={option.id}>{option.metrics.totalMiles.toFixed(1)} mi</td>)}</tr>
                  <tr><th>Equity indicator · seeded estimate</th>{options.map((option) => <td key={option.id}>{option.metrics.equityIndicator} / 100</td>)}</tr>
                  <tr><th>Refusal risk · seeded estimate</th>{options.map((option) => <td key={option.id}>{option.metrics.refusalRiskScore} / 100</td>)}</tr>
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Assumptions & exclusions">
            <div className="assumption-list">
              {selectedPlan.assumptions.map((assumption) => <p key={assumption}>{assumption}</p>)}
              {selectedPlan.excludedDestinations.map((exclusion) => <p className="exclusion" key={exclusion.destinationId}><strong>{getDestinationName(exclusion.destinationId)}</strong>{exclusion.reason}</p>)}
            </div>
          </Panel>
        </div>

        <div className={`sticky-action-rail decision-approval-rail ${validation.approvable ? "" : "rail-invalid"}`}>
          <div>
            {validation.approvable ? <CheckCircle2 size={21} aria-hidden="true" /> : <AlertTriangle size={21} aria-hidden="true" />}
            <span><strong>{selectedName} selected</strong><small>{validation.approvable ? "All quantities reconcile · Human approval required" : validation.errors[0]}</small></span>
          </div>
          <div className="approver-label"><span>Approver</span><strong>demo_user</strong></div>
          <div className="rail-actions">
            <button className="button button-secondary" type="button" onClick={() => setEditorOpen(true)} disabled={selectedPlan.strategy === "warehouse_first" || Boolean(state.approvedPlan)}>Edit quantities</button>
            <button className="button button-primary" type="button" disabled={!state.approvedPlan && !validation.approvable} onClick={() => state.approvedPlan ? router.push("/packing/PKG-104") : setApprovalOpen(true)}>
              {state.approvedPlan ? "Open packing plan" : "Review & approve"}<ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ApprovalDialog open={approvalOpen} plan={selectedPlan} onClose={() => setApprovalOpen(false)} onApprove={completeApproval} />
      <QuantityEditorDialog open={editorOpen} plan={selectedPlan} onClose={() => setEditorOpen(false)} onApply={applyEdit} />
    </>
  );
}
