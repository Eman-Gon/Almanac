"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Edit3,
  Snowflake,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { Panel } from "@/components/shared/panel";
import {
  baselineAgentRun,
  baselineAuditEvents,
  donation,
  donor,
  productLot,
  warehouse,
} from "@/data/seed/scenario";
import { useDemoState } from "@/state/demo-state";

const fields = [
  { label: "Product", value: donation.productDescription, confidence: "high" as const },
  { label: "Operational quantity", value: `${donation.quantityLb.toLocaleString()} lb`, confidence: "high" as const },
  { label: "Pickup deadline", value: "Today at 1:00 PM", confidence: "high" as const },
  { label: "Temperature", value: "Refrigerated", confidence: "high" as const },
  { label: "Pickup location", value: `${donor.location.address}, ${donor.location.city}`, confidence: "medium" as const },
  { label: "Modeled risk deadline", value: "Jul 16 at 10:45 PM", confidence: "medium" as const },
] as const;

export function DonationDetailClient() {
  const router = useRouter();
  const { generatePlans, state } = useDemoState();

  function generate() {
    generatePlans();
    router.push("/plans/PLN-104");
  }

  const availableCold = warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb;

  return (
    <div className="page-content donation-detail-page">
      <div className="context-bar">
        <Link href="/dashboard"><ArrowLeft size={16} aria-hidden="true" />Back to dashboard</Link>
        <div className="context-title"><strong>{donation.id}</strong><span className="plain-status plain-status-green">Ready for planning</span></div>
        <span className="source-label-inline">Synthetic demo data</span>
      </div>

      <div className="donation-summary-strip">
        <div><span>Product lot</span><strong>{productLot.productName}</strong></div>
        <div><span>Quantity</span><strong>{donation.quantityLb.toLocaleString()} lb</strong></div>
        <div><span>Pickup before</span><strong>1:00 PM</strong></div>
        <div><span>Handling</span><strong><Snowflake size={15} aria-hidden="true" />Refrigerated</strong></div>
      </div>

      <div className="donation-review-grid">
        <Panel title="Original donor message" className="source-message-panel">
          <blockquote>{donation.sourceText}</blockquote>
          <div className="source-message-meta">Received 10:45 AM · Market Street Grocery</div>
          <div className="fallback-notice" role="status">
            <Bot size={18} aria-hidden="true" />
            <div><strong>Demo fallback used</strong><span>No model is required. A validated seeded extraction is active.</span></div>
          </div>
        </Panel>

        <Panel title="Validated extraction" action={<button className="button button-ghost compact-button" type="button"><Edit3 size={14} aria-hidden="true" />Edit fields</button>}>
          <div className="extracted-field-list">
            {fields.map((field) => (
              <div className="extracted-field" key={field.label}>
                <span>{field.label}</span>
                <strong>{field.value}</strong>
                <ConfidenceIndicator confidence={field.confidence} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="donation-support-grid">
        <Panel title="Operational checks">
          <div className="check-list">
            <div><CheckCircle2 aria-hidden="true" /><span><strong>Required fields complete</strong><small>No blocking confirmation questions remain.</small></span></div>
            <div><WarehouseIcon aria-hidden="true" /><span><strong>{availableCold.toLocaleString()} lb compatible warehouse capacity</strong><small>The full offer will not fit in refrigerated storage.</small></span></div>
            <div><Clock3 aria-hidden="true" /><span><strong>36-hour modeled risk window</strong><small>This is an urgency signal, not a food-safety determination.</small></span></div>
          </div>
        </Panel>

        <Panel title="Donor reliability">
          <div className="reliability-grid">
            <div><strong>{donor.reliability.deliveredVsCommittedPct}%</strong><span>Delivered vs committed</span></div>
            <div><strong>{donor.reliability.onTimePct}%</strong><span>On-time pickups</span></div>
            <div><strong>{donor.reliability.conditionIssueRatePct}%</strong><span>Condition issues</span></div>
          </div>
          <div className="source-label">Synthetic history · {donor.reliability.sampleSize} offers</div>
        </Panel>

        <Panel title="Agent and audit activity">
          <ol className="activity-list">
            <li><span className="activity-dot blue" /><div><strong>Offer received</strong><small>{baselineAuditEvents[0].occurredAt.slice(11, 16)} · System</small></div></li>
            <li><span className="activity-dot purple" /><div><strong>Validated fallback extraction</strong><small>{baselineAgentRun.modelOrRuleset} · High confidence</small></div></li>
          </ol>
        </Panel>
      </div>

      <div className="sticky-action-rail">
        <div><CheckCircle2 size={20} aria-hidden="true" /><span><strong>Ready for deterministic planning</strong><small>Capacity, demand, time windows, and routes will be recalculated.</small></span></div>
        <div className="rail-actions">
          <Link className="button button-secondary" href="/dashboard">Return to dashboard</Link>
          <button className="button button-primary" type="button" onClick={generate}>
            {state.stage === "initial" ? "Generate plans" : "Open plans"}<ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
