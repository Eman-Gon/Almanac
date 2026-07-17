import Link from "next/link";
import { Archive, ArrowRight, PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import {
  historicalInventoryLots,
  productLot,
  surplusInventoryLots,
  warehouse,
} from "@/data/seed/scenario";

const riskStatusTone = {
  high: "amber",
  medium: "blue",
  low: "green",
} as const;

const riskRailTone = {
  high: "red",
  medium: "blue",
  low: "green",
} as const;

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Warehouse surplus"
        subtitle="Lots already on hand, how long they have been sitting, and the agencies that historically take them."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory" }]}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
      <div className="page-content list-page">
        <Panel
          title="Surplus lots on hand"
          action={(
            <span className="panel-meta-label">
              {1 + surplusInventoryLots.length} lots on hand · 1 interactive in this demo
            </span>
          )}
        >
          <div className="record-list">
            <Link className="record-row" href={`/inventory/${productLot.id}`}>
              <span className="record-rail red" />
              <span>
                <strong>{productLot.productName}</strong>
                <small>{productLot.id} · {warehouse.name} · 3 days on hand</small>
              </span>
              <span>
                <small>Available inventory</small>
                <strong>{productLot.availableQuantityLb.toLocaleString()} lb · refrigerated</strong>
              </span>
              <span>
                <small>Risk deadline</small>
                <strong>Jul 16 · 10:45 PM</strong>
              </span>
              <span className="plain-status plain-status-amber">High risk · Operational</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            {surplusInventoryLots.map((lot) => (
              <article className="record-row record-row-static" key={lot.id}>
                <span className={`record-rail ${riskRailTone[lot.riskLevel]}`} />
                <span>
                  <strong>{lot.productName}</strong>
                  <small>{lot.id} · {lot.warehouseName} · {lot.daysOnHand} {lot.daysOnHand === 1 ? "day" : "days"} on hand</small>
                  <small>{lot.historicalFitNote}</small>
                </span>
                <span>
                  <small>Available inventory</small>
                  <strong>{lot.quantityLb.toLocaleString()} lb · {lot.temperatureClass}</strong>
                </span>
                <span>
                  <small>Risk deadline</small>
                  <strong>{lot.riskDeadlineLabel}</strong>
                </span>
                <span className={`plain-status plain-status-${riskStatusTone[lot.riskLevel]}`}>
                  {lot.riskLevel.charAt(0).toUpperCase() + lot.riskLevel.slice(1)} risk · Display only
                </span>
                <Archive size={17} aria-hidden="true" />
              </article>
            ))}
          </div>
          <div className="guardrail-note">
            <PackageSearch size={18} aria-hidden="true" />
            <div>
              <strong>Only the strawberry lot is interactive</strong>
              <span>Other surplus lots are display-only context; each shows the agency that historically accepts that product.</span>
            </div>
          </div>
        </Panel>

        <Panel
          title="Recent inventory outcomes"
          action={<span className="panel-meta-label">Mock history · display only</span>}
        >
          <div className="record-list">
            {historicalInventoryLots.map((lot) => (
              <article className="record-row record-row-static" key={lot.id}>
                <span className={`record-rail ${lot.tone}`} />
                <span>
                  <strong>{lot.productName}</strong>
                  <small>{lot.id} · {lot.warehouseName} · {lot.receivedLabel}</small>
                </span>
                <span>
                  <small>Physical quantity</small>
                  <strong>{lot.quantityLb.toLocaleString()} lb · {lot.temperatureClass}</strong>
                </span>
                <span>
                  <small>Outcome</small>
                  <strong>{lot.outcomeLabel}</strong>
                </span>
                <span className={`plain-status plain-status-${lot.tone}`}>{lot.statusLabel}</span>
                <Archive size={17} aria-hidden="true" />
              </article>
            ))}
          </div>
          <div className="guardrail-note">
            <PackageSearch size={18} aria-hidden="true" />
            <div>
              <strong>Historical rows are context only</strong>
              <span>They do not affect dashboard KPIs, current plans, impact, or demo state.</span>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
