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
import { partners, warehouse } from "@/data/seed/scenario";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { accountedQuantityLb, validatePlanOption } from "@/domain/planning/quantity";
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
  const { state, selectPlan, approvePlan } = useDemoState();
  const [planSet] = useState(generatePlanSet);
  const [options, setOptions] = useState(planSet.options);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const selectedPlan = useMemo(
    () => options.find((option) => option.id === state.selectedPlanId) ?? options[2],
    [options, state.selectedPlanId],
  );
  const validation = validatePlanOption(selectedPlan, 1_200);

  function applyEdit(updated: PlanOption) {
    setOptions((current) => current.map((option) => (option.id === updated.id ? updated : option)));
  }

  function completeApproval(reason: string) {
    approvePlan(reason);
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
          <div><Snowflake className="summary-blue" aria-hidden="true" /><span>Warehouse cold capacity<strong>{warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb} lb</strong></span></div>
          <div><Truck className="summary-green" aria-hidden="true" /><span>Refrigerated vehicle capacity<strong>1,400 lb</strong></span></div>
          <div><CheckCircle2 className="summary-green" aria-hidden="true" /><span><strong>{accountedQuantityLb(selectedPlan).toLocaleString()} lb</strong>accounted for</span></div>
        </section>

        <section className="plan-card-grid" aria-label="Plan alternatives">
          {options.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan.id === plan.id}
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
                    const partner = partners.find((item) => item.id === allocation.destinationId);
                    const capacityFits = !partner || allocation.quantityLb <= partner.refrigeratedCapacityAvailableLb;
                    return (
                      <tr key={allocation.id}>
                        <td><Link href={`/partners/${allocation.destinationId}`}><span className="table-location-icon" />{getDestinationName(allocation.destinationId)}</Link></td>
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
                      <td>Inspection hold</td><td>By 1:00 PM</td><td><span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Fits</span></td><td>—</td>
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
                  <tr><th>Equity indicator</th>{options.map((option) => <td key={option.id}>{option.metrics.equityIndicator} / 100</td>)}</tr>
                  <tr><th>Refusal risk</th>{options.map((option) => <td key={option.id}>{option.metrics.refusalRiskScore} / 100</td>)}</tr>
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
            <button className="button button-secondary" type="button" onClick={() => setEditorOpen(true)} disabled={selectedPlan.strategy === "warehouse_first"}>Edit quantities</button>
            <button className="button button-primary" type="button" disabled={!validation.approvable} onClick={() => state.stage === "approved" ? router.push("/packing/PKG-104") : setApprovalOpen(true)}>
              {state.stage === "approved" ? "Open packing plan" : "Review & approve"}<ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ApprovalDialog open={approvalOpen} plan={selectedPlan} onClose={() => setApprovalOpen(false)} onApprove={completeApproval} />
      <QuantityEditorDialog open={editorOpen} plan={selectedPlan} onClose={() => setEditorOpen(false)} onApply={applyEdit} />
    </>
  );
}
