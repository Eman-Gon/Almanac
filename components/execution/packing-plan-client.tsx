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
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { createPackingPlan } from "@/domain/execution/create-execution";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { useDemoState } from "@/state/demo-state";

export function PackingPlanClient() {
  const router = useRouter();
  const { state } = useDemoState();
  const planSet = useMemo(() => generatePlanSet(), []);
  const selectedPlan = planSet.options.find((option) => option.id === state.selectedPlanId) ?? planSet.options[2];
  const packingPlan = useMemo(() => createPackingPlan(selectedPlan), [selectedPlan]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  function toggleBatch(batchId: string) {
    if (!started) return;
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Packing & Cross-Dock Plan"
        subtitle={`${packingPlan.id} · Derived from ${selectedPlan.name}`}
        actions={<Link className="button button-ghost" href="/plans/PLN-104"><ArrowLeft size={16} aria-hidden="true" />Back to decision room</Link>}
      />
      <div className="page-content execution-page">
        <section className="execution-summary" aria-label="Packing plan summary">
          <div><span>Plan status</span><strong className="inline-green"><CheckCircle2 size={15} aria-hidden="true" />{started ? "In progress" : "Ready"}</strong></div>
          <div><span>Product lot</span><strong>LOT-104 · Strawberries</strong></div>
          <div><span>Total accounted</span><strong>1,200 lb</strong></div>
          <div><span>Handling</span><strong className="inline-blue"><Snowflake size={15} aria-hidden="true" />Refrigerated</strong></div>
        </section>

        <div className="packing-grid">
          <Panel title="Destination batches" className="packing-table-panel">
            <div className="table-scroll">
              <table className="data-table packing-table">
                <thead><tr><th>Done</th><th>Priority</th><th>Destination</th><th>Quantity</th><th>Staging location</th><th>Instruction</th></tr></thead>
                <tbody>
                  {packingPlan.batches.map((batch) => (
                    <tr key={batch.id} className={completed.has(batch.id) ? "batch-complete" : ""}>
                      <td><input aria-label={`Mark ${getDestinationName(batch.destinationId)} batch complete`} type="checkbox" disabled={!started} checked={completed.has(batch.id)} onChange={() => toggleBatch(batch.id)} /></td>
                      <td><span className="priority-number">{batch.priority}</span></td>
                      <td><strong>{batch.destinationId === "WH-001" ? "Supervisor inspection hold" : getDestinationName(batch.destinationId)}</strong><small>{batch.id}</small></td>
                      <td className="number-cell"><strong>{batch.quantityLb.toLocaleString()} lb</strong></td>
                      <td>{batch.stagingLocation}</td>
                      <td>{batch.instruction}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><th colSpan={3}>Total</th><th className="number-cell">1,200 lb</th><td colSpan={2}>Matches approved allocation</td></tr></tfoot>
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
                <div><small>Mission</small><b>MSN-104</b><small>Source</small><b>Synthetic demo</b></div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="sticky-action-rail">
          <div><CheckCircle2 size={20} aria-hidden="true" /><span><strong>{completed.size} of {packingPlan.batches.length} batches checked</strong><small>Packing completion does not change approved allocations.</small></span></div>
          <div className="rail-actions">
            {!started ? <button className="button button-secondary" type="button" onClick={() => setStarted(true)}>Start packing</button> : null}
            <button className="button button-primary" type="button" onClick={() => router.push("/missions/MSN-104")}>Open mission<ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
