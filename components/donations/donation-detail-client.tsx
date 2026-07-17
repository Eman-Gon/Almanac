"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, Edit3, Snowflake, Warehouse as WarehouseIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { DetailsDrawer } from "@/components/shared/details-drawer";
import { LoadingState } from "@/components/shared/loading-state";
import { Panel } from "@/components/shared/panel";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { baselineAgentRun, baselineAuditEvents, donation, donor, productLot, warehouse } from "@/data/seed/scenario";
import { useDemoState } from "@/state/demo-state";

const fields = [
  { key: "product", label: "Product", confidence: "high" as const },
  { key: "quantity", label: "Operational quantity", confidence: "high" as const },
  { key: "pickupDeadline", label: "Pickup deadline", confidence: "high" as const },
  { key: "temperature", label: "Temperature", confidence: "high" as const },
  { key: "pickupLocation", label: "Pickup location", confidence: "medium" as const },
  { key: "riskDeadline", label: "Modeled urgency window", confidence: "medium" as const },
] as const;

const stageLabels = {
  initial: "Ready for planning",
  plans_generated: "Plans generated",
  approved: "Plan approved",
  disrupted: "Partner canceled",
  recovered: "Recovery approved",
} as const;

export function DonationDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { generatePlans, hydrated, state } = useDemoState();
  const [sourceOpen, setSourceOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [edited, setEdited] = useState({ product: donation.productDescription, quantity: String(donation.quantityLb), pickupDeadline: "2026-07-15T13:00" });
  const intakeSource = searchParams.get("intake");
  const usedPrimary = intakeSource === "primary_model";
  const usedBackup = intakeSource === "backup_model";
  const modelLabel = searchParams.get("model")?.slice(0, 80) ?? baselineAgentRun.modelOrRuleset;
  const intakeStatus = usedBackup
    ? { title: "Backup extraction validated", description: "The primary model failed, and the backup output passed validation; staff review is still required.", activity: "Validated backup-model extraction" }
    : usedPrimary
      ? { title: "Primary extraction validated", description: "The primary model output passed the intake schema; staff review is still required.", activity: "Validated primary-model extraction" }
      : { title: "Seeded extraction validated", description: "A validated scenario extraction is active; staff review is still required.", activity: "Validated fallback extraction" };
  const availableCold = warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb;
  const displayFields: Record<string, string> = {
    product: edited.product,
    quantity: `${Number(edited.quantity || donation.quantityLb).toLocaleString()} lb`,
    pickupDeadline: "Today at 1:00 PM",
    temperature: "Refrigerated",
    pickupLocation: `${donor.location.address}, ${donor.location.city}`,
    riskDeadline: "Jul 16 at 10:45 PM",
  };

  function generate() {
    generatePlans();
    router.push("/plans/PLN-104");
  }

  function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(edited.quantity);
    if (!edited.product.trim() || !Number.isFinite(quantity) || quantity <= 0 || !edited.pickupDeadline) {
      setEditError("Product, quantity, and pickup deadline are required. Quantity must be greater than zero.");
      return;
    }
    setEditError("");
    setEditorOpen(false);
  }

  if (!hydrated) return <LoadingState label="Loading saved donation state…" />;

  return (
    <>
      <PageHeader title="Donation details" subtitle="Review the offer before generating plans." breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Donations", href: "/donations" }, { label: donation.id }]} backHref="/dashboard" backLabel="Back to Dashboard" status={<span className="plain-status plain-status-green">{stageLabels[state.stage]}</span>} />
      <div className="page-content donation-detail-page refactor-donation-page">
        <section className="donation-summary-strip refactor-donation-summary" aria-label="Donation summary">
          <div><span>Product</span><strong>{productLot.productName}</strong></div>
          <div><span>Quantity</span><strong>{Number(edited.quantity).toLocaleString()} lb</strong></div>
          <div><span>Pickup before</span><strong>1:00 PM</strong></div>
          <div><span>Handling</span><strong><Snowflake size={15} aria-hidden="true" />Refrigerated</strong></div>
          <div><span>Donor</span><strong>{donor.name}</strong></div>
        </section>

        <div className="donation-review-grid refactor-donation-review-grid">
          <Panel title="Confirmed donation facts" className="confirmed-facts-panel" action={<button className="button button-ghost compact-button" type="button" onClick={() => setEditorOpen(true)}><Edit3 size={14} aria-hidden="true" />Edit fields</button>}>
            <div className="extracted-field-list">
              {fields.map((field) => <div className="extracted-field" key={field.key}><span>{field.label}</span><strong>{displayFields[field.key]}</strong>{field.confidence !== "high" ? <ConfidenceIndicator confidence={field.confidence} /> : null}</div>)}
            </div>
          </Panel>

          <Panel title="Original donor message" className="source-message-panel">
            <blockquote className="source-message-preview">{donation.sourceText}</blockquote>
            <div className="source-message-meta">Received 10:45 AM · {donor.name}</div>
            <button className="text-button" type="button" onClick={() => setSourceOpen(true)}>View full source message</button>
          </Panel>
        </div>

        <DetailsAccordion title="Supporting operational details">
          <div className="supporting-details-grid">
            <div><h3>Operational checks</h3><div className="check-list"><div><CheckCircle2 aria-hidden="true" /><span><strong>Required fields complete</strong><small>No blocking confirmation questions remain.</small></span></div><div><WarehouseIcon aria-hidden="true" /><span><strong>{availableCold.toLocaleString()} lb refrigerated storage headroom</strong><small>The full offer will not fit in long-term storage; {warehouse.refrigeratedStagingCapacityAvailableLb} lb of separate short-dwell staging is available.</small></span></div><div><Clock3 aria-hidden="true" /><span><strong>36-hour modeled risk window</strong><small>This is an urgency signal, not a food-safety determination.</small></span></div></div></div>
            <div><h3>Donor reliability</h3><div className="reliability-grid"><div><strong>{donor.reliability.deliveredVsCommittedPct}%</strong><span>Delivered vs committed</span></div><div><strong>{donor.reliability.onTimePct}%</strong><span>On-time pickups</span></div><div><strong>{donor.reliability.conditionIssueRatePct}%</strong><span>Condition issues</span></div></div><div className="source-label">{donor.reliability.sampleSize} prior offers in the simulated history</div></div>
            <div><h3>Agent and audit activity</h3><ol className="activity-list"><li><span className="activity-dot blue" /><div><strong>Offer received</strong><small>{baselineAuditEvents[0].occurredAt.slice(11, 16)} · System</small></div></li><li><span className="activity-dot purple" /><div><strong>{intakeStatus.activity}</strong><small>{usedPrimary || usedBackup ? modelLabel : baselineAgentRun.modelOrRuleset} · High confidence</small></div></li></ol></div>
          </div>
          <DetailsAccordion title="Technical details"><div className="technical-details"><p><strong>Extraction method</strong>{intakeStatus.description}</p><p><strong>Agent run</strong>{baselineAgentRun.id} · {baselineAgentRun.modelOrRuleset}</p><p><strong>Audit event</strong>{baselineAuditEvents[1]?.id ?? "Not available"}</p></div></DetailsAccordion>
        </DetailsAccordion>

        <StickyActionBar status={<><CheckCircle2 size={19} aria-hidden="true" /><span><strong>Ready for deterministic planning</strong><small>Capacity, demand, time windows, and routes will be recalculated.</small></span></>}>
          <Link className="button button-secondary" href="/dashboard">Back to Dashboard</Link>
          <button className="button button-primary" type="button" onClick={generate}>{state.stage === "initial" ? "Generate plans" : "Open plans"}<ArrowRight size={16} aria-hidden="true" /></button>
        </StickyActionBar>
      </div>

      <DetailsDrawer open={sourceOpen} title="Original donor message" onClose={() => setSourceOpen(false)}><blockquote className="source-message-full">{donation.sourceText}</blockquote><p className="drawer-muted">Received from {donor.name} at 10:45 AM. Source text is retained for staff verification.</p></DetailsDrawer>
      <DetailsDrawer open={editorOpen} title="Edit confirmed fields" onClose={() => setEditorOpen(false)}>
        <form className="edit-fields-form" onSubmit={saveEdits}>
          <label className="field"><span>Product</span><input value={edited.product} onChange={(event) => setEdited((current) => ({ ...current, product: event.target.value }))} /></label>
          <label className="field"><span>Operational quantity (lb)</span><input type="number" min="1" value={edited.quantity} onChange={(event) => setEdited((current) => ({ ...current, quantity: event.target.value }))} /></label>
          <label className="field"><span>Pickup deadline</span><input type="datetime-local" value={edited.pickupDeadline} onChange={(event) => setEdited((current) => ({ ...current, pickupDeadline: event.target.value }))} /></label>
          {editError ? <div className="validation-list" role="alert">{editError}</div> : null}
          <div className="drawer-form-actions"><button className="button button-secondary" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Save and revalidate</button></div>
        </form>
      </DetailsDrawer>
    </>
  );
}
