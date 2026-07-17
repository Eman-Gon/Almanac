"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  History,
  PackageCheck,
  Snowflake,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { LoadingState } from "@/components/shared/loading-state";
import { Panel } from "@/components/shared/panel";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import {
  baselineInventoryAgentRun,
  baselineAuditEvents,
  partners,
  productLot,
  warehouse,
} from "@/data/seed/scenario";
import { useDemoState } from "@/state/demo-state";

const stageLabels = {
  initial: "Ready for planning",
  plans_generated: "Plans generated",
  approved: "Plan approved",
  disrupted: "Partner canceled",
  recovered: "Recovery approved",
} as const;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatTemperature(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function InventoryLotDetailClient() {
  const router = useRouter();
  const { generatePlans, hydrated, state } = useDemoState();
  const coldHeadroomLb = warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb;
  const referenceTime = baselineAuditEvents[1]?.occurredAt ?? productLot.receivedAt;
  const hoursToRisk = Math.round(
    (Date.parse(productLot.riskDeadline) - Date.parse(referenceTime)) / (60 * 60 * 1_000),
  );
  const acceptanceRows = partners.slice(0, 4).map((partner) => ({
    partner,
    history: partner.acceptanceHistory.find((history) => history.category === productLot.category),
  }));

  function openPlans() {
    generatePlans();
    router.push("/plans/PLN-104");
  }

  if (!hydrated) return <LoadingState label="Loading saved inventory state…" />;

  return (
    <>
      <PageHeader
        title="Inventory lot detail"
        subtitle="Review an existing warehouse lot before outbound planning."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: productLot.id },
        ]}
        backHref="/inventory"
        backLabel="Back to Inventory"
        status={<span className="plain-status plain-status-green">{stageLabels[state.stage]}</span>}
      />

      <div className="page-content donation-detail-page refactor-donation-page">
        <section className="donation-summary-strip refactor-donation-summary" aria-label="Inventory lot summary">
          <div><span>Inventory lot</span><strong>{productLot.id}</strong></div>
          <div><span>Product</span><strong>{productLot.productName}</strong></div>
          <div><span>Available inventory</span><strong>{productLot.availableQuantityLb.toLocaleString()} lb</strong></div>
          <div><span>Warehouse</span><strong>{warehouse.id} · {warehouse.name}</strong></div>
          <div><span>Handling</span><strong><Snowflake size={15} aria-hidden="true" />{formatTemperature(productLot.temperatureClass)}</strong></div>
        </section>

        <div className="donation-review-grid refactor-donation-review-grid">
          <Panel title="Confirmed inventory facts" className="confirmed-facts-panel">
            <div className="extracted-field-list">
              <div className="extracted-field"><span>Physical quantity</span><strong>{productLot.quantityLb.toLocaleString()} lb</strong></div>
              <div className="extracted-field"><span>Available quantity</span><strong>{productLot.availableQuantityLb.toLocaleString()} lb</strong></div>
              <div className="extracted-field"><span>Received</span><strong>{formatDateTime(productLot.receivedAt)}</strong></div>
              <div className="extracted-field"><span>Risk deadline</span><strong>{formatDateTime(productLot.riskDeadline)}</strong></div>
              <div className="extracted-field"><span>Risk level</span><strong>High · approximately {hoursToRisk} hours remaining at review</strong></div>
              <div className="extracted-field"><span>Condition status</span><strong>Staff cleared for planning</strong></div>
            </div>
          </Panel>

          <Panel title="Warehouse decision context" className="source-message-panel">
            <div className="check-list">
              <div>
                <WarehouseIcon aria-hidden="true" />
                <span><strong>Already received at {warehouse.id}</strong><small>No donor pickup is part of this workflow.</small></span>
              </div>
              <div>
                <Snowflake aria-hidden="true" />
                <span><strong>{coldHeadroomLb.toLocaleString()} lb long-term cold headroom</strong><small>The full {productLot.availableQuantityLb.toLocaleString()} lb lot cannot be held in current refrigerated storage.</small></span>
              </div>
              <div>
                <Clock3 aria-hidden="true" />
                <span><strong>{formatDateTime(productLot.riskDeadline)} risk deadline</strong><small>Operational urgency only; not an automated food-safety determination.</small></span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="guardrail-note">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>No blocking missing facts</strong>
            <span>Quantity, temperature, warehouse location, received time, risk deadline, and staff condition status are confirmed in the seeded lot.</span>
          </div>
        </div>

        <Panel
          title="Historical agency acceptance"
          action={<span className="panel-meta-label">Explanatory evidence only</span>}
        >
          <div className="table-scroll">
            <table className="data-table acceptance-history-table">
              <caption className="sr-only">Synthetic produce acceptance history for candidate agencies</caption>
              <thead>
                <tr>
                  <th>Candidate agency</th>
                  <th>Full acceptance rate</th>
                  <th>Accepted</th>
                  <th>Refused</th>
                  <th>Short receipt</th>
                  <th>Sample size</th>
                </tr>
              </thead>
              <tbody>
                {acceptanceRows.map(({ partner, history }) => (
                  <tr key={partner.id}>
                    <td><Link href={`/partners/${partner.id}`}><strong>{partner.name}</strong></Link></td>
                    <td>{history ? `${history.acceptanceRatePct}%` : "Unknown"}</td>
                    <td>{history?.acceptedCount ?? "Unknown"}</td>
                    <td>{history?.refusedCount ?? "Unknown"}</td>
                    <td>{history?.shortReceiptCount ?? "Unknown"}</td>
                    <td>{history ? `${history.sampleSize} produce offers` : "No sample"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="guardrail-note">
            <History size={18} aria-hidden="true" />
            <div>
              <strong>History informs explanations, not eligibility</strong>
              <span>Current capacity, receiving windows, status, and hard constraints always take precedence.</span>
            </div>
          </div>
        </Panel>

        <DetailsAccordion title="Audit and provenance details">
          <div className="supporting-details-grid">
            <div>
              <h3>Staff condition record</h3>
              <p>Staff-cleared for planning. ChoiceGrid does not certify safety or replace warehouse inspection policy.</p>
            </div>
            <div>
              <h3>Source and current state</h3>
              <p>Source type: existing inventory · Status: {productLot.status} · Current location: {productLot.currentLocationId}.</p>
            </div>
            <div>
              <h3>Validated fallback</h3>
              <p>{baselineInventoryAgentRun.modelOrRuleset} recorded {baselineInventoryAgentRun.status.replaceAll("_", " ")}; deterministic planning remains available.</p>
            </div>
          </div>
          <DetailsAccordion title="Technical details">
            <div className="technical-details">
              <p><strong>Inventory audit</strong>{baselineAuditEvents[0]?.id ?? "Unknown"} · {baselineAuditEvents[0]?.eventType.replaceAll("_", " ") ?? "Unknown"}</p>
              <p><strong>Risk review</strong>{baselineAuditEvents[1]?.id ?? "Unknown"} · {baselineAuditEvents[1]?.reason ?? "No reason recorded"}</p>
            </div>
          </DetailsAccordion>
        </DetailsAccordion>

        <StickyActionBar
          status={(
            <>
              <PackageCheck size={19} aria-hidden="true" />
              <span>
                <strong>Ready for deterministic outbound planning</strong>
                <small>Capacity, demand, receiving windows, history, and warehouse-origin routes will be recalculated.</small>
              </span>
            </>
          )}
        >
          <Link className="button button-secondary" href="/inventory">Return to Inventory</Link>
          <button className="button button-primary" type="button" onClick={openPlans}>
            {state.stage === "initial" ? "Generate outbound plans" : "Open outbound plans"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </StickyActionBar>
      </div>
    </>
  );
}
