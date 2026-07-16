"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  Snowflake,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { useDemoState } from "@/state/demo-state";

export function PackingPlanClient({
  packingPlanId,
}: {
  packingPlanId: "PKG-104" | "PKG-105";
}) {
  const router = useRouter();
  const { state, hydrated, startPacking, setPackingBatchComplete } = useDemoState();
  const planSet = useMemo(() => generatePlanSet(), []);
  const selectedPlan =
    (packingPlanId === "PKG-105" ? state.disruption?.recoveryOption : state.approvedPlan) ??
    state.planOverrides[state.selectedPlanId] ??
    planSet.options.find((option) => option.id === state.selectedPlanId) ??
    planSet.options[2];
  const packingPlan = state.packingPlans[packingPlanId];

  if (!hydrated) {
    return <div className="route-state"><strong>Loading saved packing state…</strong></div>;
  }

  if (!packingPlan) {
    return (
      <>
        <PageHeader title="Packing & Cross-Dock Plan" subtitle={`${packingPlanId} · Not created`} />
        <div className="route-state">
          <strong>The packing plan has not been created yet.</strong>
          <span>{packingPlanId === "PKG-105" ? "Approve recovery before opening replacement packing instructions." : "Approve a feasible allocation plan before starting packing."}</span>
          <Link className="button button-primary" href={packingPlanId === "PKG-105" ? "/simulate" : "/plans/PLN-104"}>{packingPlanId === "PKG-105" ? "Open recovery" : "Open Decision Room"}</Link>
        </div>
      </>
    );
  }

  const started = packingPlan.status === "in_progress" || packingPlan.status === "complete";
  const historical = state.stage === "recovered" && packingPlanId === "PKG-104";
  const completedCount = packingPlan.batches.filter(
    (batch) => batch.status === "complete",
  ).length;
  const totalAccountedLb = packingPlan.batches.reduce(
    (total, batch) => total + batch.quantityLb,
    0,
  );

  function toggleBatch(batchId: string, status: "pending" | "complete") {
    if (!started || historical) return;
    setPackingBatchComplete(packingPlan.id, batchId, status !== "complete");
  }

  return (
    <>
      <PageHeader
        title="Packing & Cross-Dock Plan"
        subtitle={`${packingPlan.id} · Derived from ${selectedPlan.name}`}
        actions={<Link className="button button-ghost" href={packingPlanId === "PKG-105" ? "/simulate" : "/plans/PLN-104"}><ArrowLeft size={16} aria-hidden="true" />{packingPlanId === "PKG-105" ? "Back to recovery" : "Back to decision room"}</Link>}
      />
      <div className="page-content execution-page">
        {historical ? <div className="guardrail-note"><CheckCircle2 size={18} aria-hidden="true" /><div><strong>Historical packing plan</strong><span>PKG-105 is active after recovery. Original batch history is read-only.</span></div></div> : null}
        <section className="execution-summary" aria-label="Packing plan summary">
          <div><span>Plan status</span><strong className="inline-green"><CheckCircle2 size={15} aria-hidden="true" />{packingPlan.status.replace("_", " ")}</strong></div>
          <div><span>Product lot</span><strong>LOT-104 · Strawberries</strong></div>
          <div><span>Total accounted</span><strong>{totalAccountedLb.toLocaleString()} lb</strong></div>
          <div><span>Handling</span><strong className="inline-blue"><Snowflake size={15} aria-hidden="true" />Refrigerated</strong></div>
        </section>

        <div className="packing-grid">
          <Panel title="Destination batches" className="packing-table-panel">
            <div className="table-scroll">
              <table className="data-table packing-table">
                <thead><tr><th>Done</th><th>Priority</th><th>Destination</th><th>Quantity</th><th>Staging location</th><th>Instruction</th></tr></thead>
                <tbody>
                  {packingPlan.batches.map((batch) => (
                    <tr key={batch.id} className={batch.status === "complete" ? "batch-complete" : ""}>
                      <td><input aria-label={`Mark ${getDestinationName(batch.destinationId)}${packingPlan.batches.filter((candidate) => candidate.destinationId === batch.destinationId).length > 1 ? ` ${batch.quantityLb} lb` : ""} batch complete`} type="checkbox" disabled={!started || historical} checked={batch.status === "complete"} onChange={() => toggleBatch(batch.id, batch.status)} /></td>
                      <td><span className="priority-number">{batch.priority}</span></td>
                      <td><strong>{batch.destinationId === "WH-001" ? "Supervisor inspection hold" : getDestinationName(batch.destinationId)}</strong><small>{batch.id}</small></td>
                      <td className="number-cell"><strong>{batch.quantityLb.toLocaleString()} lb</strong></td>
                      <td>{batch.stagingLocation}</td>
                      <td>{batch.instruction}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><th colSpan={3}>Total</th><th className="number-cell">{totalAccountedLb.toLocaleString()} lb</th><td colSpan={2}>Matches approved allocation</td></tr></tfoot>
              </table>
            </div>
          </Panel>

          <div className="packing-side-stack">
            <Panel title="Handling guardrails">
              <div className="check-list">
                <div><Snowflake aria-hidden="true" /><span><strong>Maintain refrigeration</strong><small>Use temperature-compatible staging and vehicle only.</small></span></div>
                <div><ClipboardCheck aria-hidden="true" /><span><strong>Staff condition check</strong><small>No automated food-safety determination is made.</small></span></div>
                <div><PackageCheck aria-hidden="true" /><span><strong>Quantity locked</strong><small>Completion controls cannot change approved pounds.</small></span></div>
              </div>
            </Panel>
            <Panel title="Label preview" className="label-preview-panel">
              <div className="batch-label">
                <span>CHOICEGRID · LOT-104</span>
                <strong>STRAWBERRIES</strong>
                <span>KEEP REFRIGERATED</span>
                <div><small>Mission</small><b>{packingPlanId === "PKG-105" ? "MSN-105" : "MSN-104"}</b><small>Source</small><b>Synthetic demo</b></div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="sticky-action-rail">
          <div><CheckCircle2 size={20} aria-hidden="true" /><span><strong>{completedCount} of {packingPlan.batches.length} batches checked</strong><small>Packing completion persists and does not change approved allocations.</small></span></div>
          <div className="rail-actions">
            {!started && !historical ? <button className="button button-secondary" type="button" onClick={() => startPacking(packingPlan.id)}>Start packing</button> : null}
            <button className="button button-primary" type="button" onClick={() => router.push(packingPlanId === "PKG-105" ? "/missions/MSN-105" : "/missions/MSN-104")}>Open mission<ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
