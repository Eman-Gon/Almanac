import Link from "next/link";
import { Archive, ArrowRight, PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import {
  historicalInventoryLots,
  productLot,
  warehouse,
} from "@/data/seed/scenario";

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="At-risk inventory"
        subtitle="Review warehouse lots approaching an operational risk deadline."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory" }]}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        actions={(
          <Link className="button button-secondary" href="/inventory/preview">
            Multi-item scenario
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      />
      <div className="page-content list-page">
        <Panel
          title="Operational lots"
          action={<span className="panel-meta-label">1 operational lot</span>}
        >
          <div className="record-list">
            <Link className="record-row" href={`/inventory/${productLot.id}`}>
              <span className="record-rail red" />
              <span>
                <strong>{productLot.productName}</strong>
                <small>{productLot.id} · {warehouse.name}</small>
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
