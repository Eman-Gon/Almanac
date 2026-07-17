"use client";

import { AlertTriangle, Scale, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDestinationName } from "@/domain/planning/generate-plans";
import { productLot } from "@/data/seed/scenario";
import { validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import type { PlanOption } from "@/domain/types";

export function QuantityEditorDialog({
  open,
  plan,
  onClose,
  onApply,
}: {
  open: boolean;
  plan: PlanOption;
  onClose: () => void;
  onApply: (plan: PlanOption, reason: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(plan.allocations.map((allocation) => [allocation.id, allocation.quantityLb])),
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuantities(Object.fromEntries(plan.allocations.map((allocation) => [allocation.id, allocation.quantityLb])));
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, plan]);

  const validation = useMemo(() => {
    const allocations = plan.allocations.map((allocation) => ({
      ...allocation,
      quantityLb: quantities[allocation.id] ?? 0,
    }));
    const candidate = { ...plan, allocations };
    const planValidation = validatePlanOption(candidate, scenarioValidationContext);
    const errors = [...planValidation.errors];
    const total =
      allocations.reduce((sum, allocation) => sum + allocation.quantityLb, 0) +
      plan.inspectionHoldLb +
      plan.unallocatedLb;
    if (!reason.trim()) errors.push("Enter a reason for the allocation change.");
    return { candidate, errors, total };
  }, [plan, quantities, reason]);

  function close() {
    setReason("");
    onClose();
  }

  return (
    <dialog className="approval-dialog quantity-dialog" ref={dialogRef} onCancel={(event) => { event.preventDefault(); close(); }}>
      <form method="dialog" onSubmit={(event) => {
        event.preventDefault();
        if (validation.errors.length) return;
        onApply(validation.candidate, reason.trim());
        close();
      }}>
        <div className="dialog-header">
          <div className="dialog-icon purple"><Scale size={22} aria-hidden="true" /></div>
          <div><h2>Edit outbound allocations</h2><p>Capacity and inventory conservation recalculate immediately.</p></div>
          <button className="icon-button" type="button" onClick={close} aria-label="Close quantity editor"><X size={18} /></button>
        </div>
        <div className="dialog-body">
          <div className="quantity-fields">
            {plan.allocations.map((allocation) => (
              <label className="field quantity-field" key={allocation.id}>
                <span>{getDestinationName(allocation.destinationId)}</span>
                <span className="quantity-input-wrap"><input type="number" min="0" value={quantities[allocation.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [allocation.id]: Number(event.target.value) }))} /><em>lb</em></span>
              </label>
            ))}
          </div>
          <div className={`quantity-total ${validation.total === productLot.availableQuantityLb ? "total-valid" : "total-invalid"}`}>
            <span>Available inventory accounted</span><strong>{validation.total.toLocaleString()} / {productLot.availableQuantityLb.toLocaleString()} lb</strong>
          </div>
          <label className="field">
            <span>Reason for change</span>
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for the audit event" />
          </label>
          {validation.errors.length ? (
            <div className="validation-list" role="alert"><AlertTriangle size={17} aria-hidden="true" /><ul>{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>
          ) : null}
        </div>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={close}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={validation.errors.length > 0}>Apply changes</button>
        </div>
      </form>
    </dialog>
  );
}
