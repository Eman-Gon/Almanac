"use client";

import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PlanOption } from "@/domain/types";

export function ApprovalDialog({
  open,
  plan,
  onClose,
  onApprove,
}: {
  open: boolean;
  plan: PlanOption;
  onClose: () => void;
  onApprove: (reason: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setConfirmed(false);
    setReason("");
    onClose();
  }

  return (
    <dialog
      className="approval-dialog"
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => { if (open) close(); }}
    >
      <form method="dialog" onSubmit={(event) => {
        event.preventDefault();
        if (!confirmed) return;
        onApprove(reason.trim());
        close();
      }}>
        <div className="dialog-header">
          <div className="dialog-icon"><ShieldCheck size={22} aria-hidden="true" /></div>
          <div><h2>Review & approve</h2><p>This creates warehouse packing instructions and an assigned outbound mission.</p></div>
          <button className="icon-button" type="button" onClick={close} aria-label="Close approval dialog"><X size={18} /></button>
        </div>
        <div className="dialog-body">
          <div className="approval-summary">
            <span>Selected plan</span><strong>{plan.name}</strong>
            <span>Available inventory accounted for</span><strong>1,200 lb</strong>
            <span>Approver</span><strong>demo_user</strong>
            <span>Operational status</span><strong className="summary-ok"><CheckCircle2 size={14} aria-hidden="true" />All hard constraints pass</strong>
          </div>
          <label className="field">
            <span>Approval reason (optional)</span>
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Best balance of urgency, capacity, and documented need" />
          </label>
          <label className="confirmation-check">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>I reviewed the allocations, assumptions, and risks. Approve this plan as <strong>demo_user</strong>.</span>
          </label>
        </div>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={close}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={!confirmed}>Approve & create outbound mission</button>
        </div>
      </form>
    </dialog>
  );
}
