"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageSearch,
  Snowflake,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { NetworkSnapshot } from "@/components/shared/network-snapshot";
import { Panel } from "@/components/shared/panel";
import {
  expirationRiskItems,
  partners,
  productLot,
  scenario,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { useDemoState } from "@/state/demo-state";

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "amber" | "blue";
}) {
  return (
    <article className="kpi-card refactor-kpi-card">
      <span className={`kpi-label kpi-label-${tone}`}>{label}</span>
      <strong className={`kpi-value text-${tone}`}>{value}</strong>
    </article>
  );
}

export default function DashboardPage() {
  const { state } = useDemoState();
  const planSet = generatePlanSet();
  const snapshotPlan = state.approvedPlan
    ?? state.planOverrides[state.selectedPlanId]
    ?? planSet.options.find((option) => option.id === state.selectedPlanId)
    ?? planSet.options[2];
  const decisionContextIds = new Set([
    ...snapshotPlan.allocations.map((allocation) => allocation.destinationId),
    ...snapshotPlan.excludedDestinations.map((exclusion) => exclusion.destinationId),
  ]);
  const partnerLocations = partners.filter((partner) => decisionContextIds.has(partner.id)).length;
  const refrigeratedVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "available" && vehicle.temperatureCapability.includes("refrigerated"),
  ).length;
  const coldHeadroomLb = warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb;
  const capacityWarnings = coldHeadroomLb < productLot.availableQuantityLb ? 1 : 0;
  const activeMissionId = state.stage === "recovered" ? "MSN-105" : "MSN-104";
  const activeMission = state.missions[activeMissionId];

  return (
    <>
      <PageHeader
        title="Operations Control Tower"
        subtitle={`${scenario.currentDateLabel} · Warehouse inventory release and disruption recovery.`}
      />
      <div className="page-content dashboard-page refactor-dashboard">
        <section className="urgent-offer-card" aria-labelledby="at-risk-inventory-title">
          <div className="urgent-offer-icon"><PackageSearch size={24} aria-hidden="true" /></div>
          <div className="urgent-offer-copy">
            <span className="section-eyebrow">At-risk inventory</span>
            <h2 id="at-risk-inventory-title">{productLot.productName}</h2>
            <p>{productLot.id} · {productLot.availableQuantityLb.toLocaleString()} lb available · already at {warehouse.id} · refrigerated · high risk</p>
          </div>
          <Link className="button button-primary" href={`/inventory/${productLot.id}`}>
            Review inventory lot<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        {state.stage === "recovered" ? (
          <div className="inline-success" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            Recovery approved. The replacement warehouse-release route is active.
            <Link href="/impact">View impact</Link>
          </div>
        ) : null}

        <section className="kpi-grid refactor-kpi-grid" aria-label="Urgent operational summary">
          <KpiCard label="At-risk lots" value="1" tone="red" />
          <KpiCard label="Pounds approaching risk deadline" value={`${productLot.availableQuantityLb.toLocaleString()} lb`} tone="amber" />
          <KpiCard label="Refrigerated storage headroom" value={`${coldHeadroomLb.toLocaleString()} lb`} tone="blue" />
          <KpiCard label="Short-dwell cold staging" value={`${warehouse.refrigeratedStagingCapacityAvailableLb.toLocaleString()} lb`} tone="blue" />
        </section>

        <div className="dashboard-refactor-grid">
          <Panel
            title="Active mission"
            action={<Link className="panel-link" href="/missions">View active mission</Link>}
            className="missions-panel"
          >
            {activeMission ? (
              <Link className="mission-summary-card" href={`/missions/${activeMissionId}`}>
                <div>
                  <span className="section-eyebrow">Strawberry inventory release</span>
                  <h3>{activeMissionId === "MSN-105" ? "Recovery route" : "Approved outbound route"}</h3>
                  <p>{(activeMission.stops[0]?.quantityPickupLb ?? 0).toLocaleString()} lb outbound · {activeMission.stops.length} stops · {activeMission.status.replaceAll("_", " ")}</p>
                </div>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : (
              <EmptyState title="No outbound mission has been approved yet.">
                Review the at-risk lot and compare release plans first.
              </EmptyState>
            )}
          </Panel>
          <NetworkSnapshot
            partnerLocations={partnerLocations}
            refrigeratedVehicles={refrigeratedVehicles}
            capacityWarnings={capacityWarnings}
          />
        </div>

        <div className="dashboard-refactor-lower">
          <Panel title="Overnight briefing" className="briefing-panel">
            <ul className="briefing-list">
              <li>Release the 1,200 lb strawberry lot before its seeded risk deadline.</li>
              <li>Long-term cold storage has only {coldHeadroomLb.toLocaleString()} lb of headroom; compare outbound alternatives.</li>
            </ul>
            <DetailsAccordion title="View full briefing">
              <div className="briefing-detail">
                <strong>Inventory state</strong>
                <span><WarehouseIcon size={14} aria-hidden="true" />The lot is already at {warehouse.name} and staff-cleared for planning.</span>
              </div>
              <div className="briefing-detail">
                <strong>Risk guardrail</strong>
                <span><Clock3 size={14} aria-hidden="true" />The risk deadline prioritizes work; it is not an automated food-safety decision.</span>
              </div>
              <div className="briefing-detail">
                <strong>Cold chain</strong>
                <span><Snowflake size={14} aria-hidden="true" />Current storage, staging, agency capacity, and receiving windows remain hard constraints.</span>
              </div>
            </DetailsAccordion>
          </Panel>

          <Panel
            title="Expiration risk"
            className="risk-panel"
            action={<Link className="panel-link" href="/inventory">View all inventory</Link>}
          >
            <div className="risk-list">
              {expirationRiskItems.slice(0, 3).map((item, index) => (
                <div className={`risk-row risk-${item.risk.toLowerCase()}`} key={item.product}>
                  <strong>{item.product}</strong>
                  <span>{item.quantityLb.toLocaleString()} lb</span>
                  <span>{index === 0 ? "Jul 16 by 10:45 PM" : item.timing}</span>
                  <span className="risk-badge">{item.risk}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
