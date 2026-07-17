"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Layers3,
  LockKeyhole,
  PackageSearch,
  ShieldCheck,
  Snowflake,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { useState } from "react";
import { multiItemScenario } from "@/data/seed/multi-item-scenario";
import {
  buildMultiItemPlanPreview,
  MULTI_ITEM_URGENCY_CONFIG,
} from "@/domain/inventory/multi-item-portfolio";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { Panel } from "@/components/shared/panel";
import { ProvenanceTag } from "@/components/shared/provenance";
import styles from "./multi-item-scenario.module.css";

const planPreview = buildMultiItemPlanPreview(multiItemScenario);
const lotById = new Map(
  multiItemScenario.lots.map((lot) => [lot.id, lot]),
);

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatTimeWindow(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function MultiItemScenarioClient() {
  const [selectedLotId, setSelectedLotId] = useState(
    planPreview.rankedLots[0]?.lot.id ?? multiItemScenario.lots[0]?.id ?? "",
  );
  const [authorized, setAuthorized] = useState(false);
  const [approved, setApproved] = useState(false);
  const selectedLot = planPreview.rankedLots.find(
    (entry) => entry.lot.id === selectedLotId,
  ) ?? planPreview.rankedLots[0];
  const totalQuantityLb = planPreview.reconciliation.totalAvailableQuantityLb;
  const blockedLots = planPreview.rankedLots.filter(
    (entry) => entry.planningBlocked,
  ).length;
  const temperatureClasses = new Set(
    multiItemScenario.lots.map((lot) => lot.temperatureClass),
  ).size;

  return (
    <div className={`page-content ${styles.page}`} data-testid="multi-item-scenario">
      <section className={styles.guardrail} aria-label="Secondary scenario guardrail">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Interactive secondary scenario · 0 operational changes</strong>
          <span>
            This portfolio is synthetic and route-local. It cannot replace the strawberry
            hero, reserve inventory, create a mission, or contact a partner.
          </span>
        </div>
        <span className={styles.previewBadge}>Preview</span>
      </section>

      <section className={styles.hero} aria-labelledby="multi-item-heading">
        <div>
          <span className={styles.eyebrow}>Warehouse portfolio triage</span>
          <h2 id="multi-item-heading">Four products. One coordinated release preview.</h2>
          <p>
            Rank independent lots, protect their quantities and handling rules, then group
            compatible product lines by receiving agency.
          </p>
        </div>
        <dl className={styles.heroMetrics}>
          <div><dt>Active lots</dt><dd>{multiItemScenario.lots.length}</dd></div>
          <div><dt>Visible inventory</dt><dd>{totalQuantityLb.toLocaleString()} lb</dd></div>
          <div><dt>Handling zones</dt><dd>{temperatureClasses}</dd></div>
          <div><dt>Needs confirmation</dt><dd>{blockedLots}</dd></div>
        </dl>
      </section>

      <div className={styles.primaryGrid}>
        <Panel
          title="Warehouse risk queue"
          action={<ProvenanceTag derivation="calculated" />}
          className={styles.queuePanel}
        >
          <div className={styles.queue} role="list" aria-label="Ranked warehouse lots">
            {planPreview.rankedLots.map((entry, index) => {
              const selected = entry.lot.id === selectedLot?.lot.id;
              return (
                <button
                  className={`${styles.queueRow} ${selected ? styles.queueRowSelected : ""}`}
                  type="button"
                  key={entry.lot.id}
                  aria-pressed={selected}
                  onClick={() => setSelectedLotId(entry.lot.id)}
                >
                  <span className={styles.rank}>{index + 1}</span>
                  <span className={styles.product}>
                    <strong>{entry.lot.productName}</strong>
                    <small>{entry.lot.id} · {titleCase(entry.lot.temperatureClass)}</small>
                  </span>
                  <span className={styles.quantity}>
                    <small>Available</small>
                    <strong>{entry.lot.availableQuantityLb.toLocaleString()} lb</strong>
                  </span>
                  <span className={styles.deadline}>
                    <small>Operational risk deadline</small>
                    <strong>{formatDateTime(entry.lot.riskDeadline)}</strong>
                  </span>
                  <span className={`${styles.risk} ${styles[`risk${titleCase(entry.urgencyBand)}`]}`}>
                    {entry.urgencyScore} · {titleCase(entry.urgencyBand)}
                  </span>
                  <ArrowRight aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          title={selectedLot ? `${selectedLot.lot.productName} decision context` : "Lot detail"}
          action={selectedLot ? (
            <span className={selectedLot.planningBlocked ? styles.blockedBadge : styles.readyBadge}>
              {selectedLot.planningBlocked ? "Staff check required" : "Eligible for preview"}
            </span>
          ) : null}
          className={styles.detailPanel}
        >
          {selectedLot ? (
            <>
              <dl className={styles.detailFacts}>
                <div>
                  <dt>Category</dt>
                  <dd>{titleCase(selectedLot.lot.category)}</dd>
                </div>
                <div>
                  <dt>Condition</dt>
                  <dd>{titleCase(selectedLot.lot.conditionStatus)}</dd>
                </div>
                <div>
                  <dt>Compatible headroom</dt>
                  <dd>{selectedLot.compatibleStorageHeadroomLb.toLocaleString()} lb</dd>
                </div>
                <div>
                  <dt>Headroom pressure</dt>
                  <dd>{selectedLot.overflowLb.toLocaleString()} lb</dd>
                </div>
              </dl>
              <ul className={styles.reasonList}>
                {selectedLot.reasons.map((reason) => (
                  <li key={reason}>
                    {selectedLot.planningBlocked && reason.includes("confirmation")
                      ? <AlertTriangle aria-hidden="true" />
                      : <CheckCircle2 aria-hidden="true" />}
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              <DetailsAccordion title="Scoring and handling details">
                <div className={styles.detailNotes}>
                  <p>
                    <strong>Urgency ruleset</strong>
                    {MULTI_ITEM_URGENCY_CONFIG.ruleset}; deadline pressure 55%, seeded
                    risk signal 30%, compatible storage pressure 15%.
                  </p>
                  <p>
                    <strong>Handling tags</strong>
                    {selectedLot.lot.usabilityTags.map(titleCase).join(", ")}.
                  </p>
                  <p>
                    <strong>Safety boundary</strong>
                    Urgency prioritizes staff review. It never declares a product safe.
                  </p>
                </div>
              </DetailsAccordion>
            </>
          ) : null}
        </Panel>
      </div>

      <Panel
        title="Coordinated release preview"
        action={<span className={styles.planId}>{planPreview.id} · {planPreview.ruleset}</span>}
      >
        <div className={styles.planSummary}>
          <div>
            <PackageSearch aria-hidden="true" />
            <span>Planned outbound<strong>{planPreview.plannedOutboundQuantityLb.toLocaleString()} lb</strong></span>
          </div>
          <div>
            <WarehouseIcon aria-hidden="true" />
            <span>Retained at warehouse<strong>{planPreview.retainedQuantityLb.toLocaleString()} lb</strong></span>
          </div>
          <div>
            <Snowflake aria-hidden="true" />
            <span>Inspection hold<strong>{planPreview.inspectionHoldLb.toLocaleString()} lb</strong></span>
          </div>
          <div>
            <ClipboardCheck aria-hidden="true" />
            <span>Inventory accounted<strong>{planPreview.reconciliation.totalAccountedQuantityLb.toLocaleString()} lb</strong></span>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.reconciliationTable}>
            <caption>Per-lot conservation for the coordinated release preview</caption>
            <thead>
              <tr>
                <th>Product lot</th>
                <th>Available</th>
                <th>Planned outbound</th>
                <th>Retained</th>
                <th>Inspection hold</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>
              {planPreview.reconciliation.perLot.map((row) => {
                const lot = lotById.get(row.productLotId);
                return (
                  <tr key={row.productLotId}>
                    <td><strong>{lot?.productName ?? row.productLotId}</strong><small>{row.productLotId}</small></td>
                    <td>{row.availableQuantityLb.toLocaleString()} lb</td>
                    <td>{row.allocatedQuantityLb.toLocaleString()} lb</td>
                    <td>{row.retainedQuantityLb.toLocaleString()} lb</td>
                    <td>{row.inspectionHoldLb.toLocaleString()} lb</td>
                    <td><span className={styles.pass}><CheckCircle2 aria-hidden="true" />Pass</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className={styles.approval} aria-labelledby="preview-approval-title">
          <div>
            <span className={styles.eyebrow}>Human checkpoint</span>
            <h3 id="preview-approval-title">Authorize this local plan preview</h3>
            <p>
              Approval reveals grouped outreach drafts. It does not approve food safety,
              reserve pounds, create packing work, or dispatch a vehicle.
            </p>
          </div>
          <label className={styles.approvalCheck}>
            <input
              type="checkbox"
              checked={authorized}
              onChange={(event) => {
                setAuthorized(event.target.checked);
                if (!event.target.checked) setApproved(false);
              }}
            />
            <span>
              I reviewed all four lot totals, the chicken inspection hold, and the
              synthetic agency capacity assumptions.
            </span>
          </label>
          <button
            className="button button-primary"
            type="button"
            disabled={!authorized}
            onClick={() => setApproved(true)}
          >
            Approve coordinated preview
          </button>
        </section>

        {approved ? (
          <div className={styles.approved} role="status">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <strong>Preview approved locally</strong>
              <span>
                {planPreview.outreachGroups.length} grouped outreach drafts generated ·
                0 calls · 0 inventory reservations · 0 operational changes
              </span>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Grouped partner outreach"
        action={<span className={styles.planId}>Drafts stay locked until local approval</span>}
      >
        {approved ? (
          <div className={styles.outreachGrid}>
            {planPreview.outreachGroups.map((group) => (
              <article className={styles.outreachCard} key={group.partnerId}>
                <div className={styles.outreachHeader}>
                  <div>
                    <span className={styles.eyebrow}>Synthetic receiving context</span>
                    <h3>{group.partnerName}</h3>
                  </div>
                  <strong>{group.allocatedQuantityLb.toLocaleString()} lb</strong>
                </div>
                <div className={styles.outreachMeta}>
                  <span><Clock3 aria-hidden="true" />{formatTimeWindow(group.receivingWindow.start, group.receivingWindow.end)}</span>
                  <span><Layers3 aria-hidden="true" />{group.allocatedQuantityLb.toLocaleString()} / {group.capacityLb.toLocaleString()} lb capacity</span>
                </div>
                <ul className={styles.lineItems}>
                  {group.lineItems.map((line) => (
                    <li key={`${group.partnerId}-${line.productLotId}`}>
                      <span>{line.productName}<small>{line.productLotId} · history {line.historyConfidence}</small></span>
                      <strong>{line.quantityLb.toLocaleString()} lb</strong>
                    </li>
                  ))}
                </ul>
                <DetailsAccordion title="Review generated outreach draft">
                  <p className={styles.draft}>{group.draft}</p>
                </DetailsAccordion>
                <span className={styles.notSent}>Synthetic draft · not sent · no commitment recorded</span>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.locked}>
            <LockKeyhole aria-hidden="true" />
            <div>
              <strong>Outreach drafts are not active</strong>
              <span>Review and authorize the coordinated preview above to reveal them.</span>
            </div>
          </div>
        )}
      </Panel>

      <section className={styles.footerAction}>
        <div>
          <strong>Strawberry Rescue remains the executable demo</strong>
          <span>
            Use it for plan approval, packing, mission creation, disruption recovery,
            and calculated impact.
          </span>
        </div>
        <Link className="button button-secondary" href="/dashboard">
          Return to Strawberry Inventory Release
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
