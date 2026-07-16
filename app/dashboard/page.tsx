"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, PackageOpen } from "lucide-react";
import { expirationRiskItems, partners, vehicles, warehouse } from "@/data/seed/scenario";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { NetworkSnapshot } from "@/components/shared/network-snapshot";
import { Panel } from "@/components/shared/panel";
import { getDashboardSummary } from "@/domain/dashboard/summary";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { useDemoState } from "@/state/demo-state";

const summary = getDashboardSummary();

function KpiCard({ label, value, tone }: { label: string; value: string; tone: "red" | "amber" | "blue" }) {
  return <article className="kpi-card refactor-kpi-card"><span className={`kpi-label kpi-label-${tone}`}>{label}</span><strong className={`kpi-value text-${tone}`}>{value}</strong></article>;
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
  const refrigeratedVehicles = vehicles.filter((vehicle) => vehicle.status === "available" && vehicle.temperatureCapability.includes("refrigerated")).length;
  const capacityWarnings = warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb < 1_200 ? 1 : 0;
  const activeMissionId = state.stage === "recovered" ? "MSN-105" : "MSN-104";
  const activeMission = state.missions[activeMissionId];

  return (
    <>
      <PageHeader title="Operations Control Tower" subtitle="Review urgent offers and active food movements." />
      <div className="page-content dashboard-page refactor-dashboard">
        <section className="urgent-offer-card" aria-labelledby="urgent-offer-title">
          <div className="urgent-offer-icon"><PackageOpen size={24} aria-hidden="true" /></div>
          <div className="urgent-offer-copy"><span className="section-eyebrow">Urgent donation</span><h2 id="urgent-offer-title">Strawberries</h2><p>1,200 lb · pickup before 1:00 PM · refrigerated</p></div>
          <Link className="button button-primary" href="/donations/DON-104">Review donation<ArrowRight size={16} aria-hidden="true" /></Link>
        </section>

        {state.stage === "recovered" ? <div className="inline-success" role="status"><CheckCircle2 size={18} aria-hidden="true" />Recovery approved. The replacement route is active.<Link href="/impact">View impact</Link></div> : null}

        <section className="kpi-grid refactor-kpi-grid" aria-label="Urgent operational summary">
          <KpiCard label="Urgent offers" value={String(summary.urgentOffers)} tone="red" />
          <KpiCard label="Pounds at expiration risk" value={`${summary.poundsAtHighExpirationRisk.toLocaleString()} lb`} tone="amber" />
          <KpiCard label="Available refrigerated capacity" value={`${(warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb).toLocaleString()} lb`} tone="blue" />
        </section>

        <div className="dashboard-refactor-grid">
          <Panel title="Active mission" action={<Link className="panel-link" href="/missions">View all missions</Link>} className="missions-panel">
            {activeMission ? (
              <Link className="mission-summary-card" href={`/missions/${activeMissionId}`}>
                <div><span className="section-eyebrow">Strawberry Rescue</span><h3>{activeMissionId === "MSN-105" ? "Recovery route" : "Approved route"}</h3><p>1,200 lb · {activeMission.stops.length} stops · {activeMission.status.replaceAll("_", " ")}</p></div>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : <EmptyState title="No mission has been created for this donation yet." />}
          </Panel>
          <NetworkSnapshot partnerLocations={partnerLocations} refrigeratedVehicles={refrigeratedVehicles} capacityWarnings={capacityWarnings} />
        </div>

        <div className="dashboard-refactor-lower">
          <Panel title="Overnight briefing" className="briefing-panel">
            <ul className="briefing-list">
              <li>Prioritize the strawberry offer before the 1:00 PM pickup deadline.</li>
              <li>Cold storage is tight; compare direct delivery with the inspection-hold option.</li>
            </ul>
            <DetailsAccordion title="View full briefing">
              <div className="briefing-detail"><strong>Why it matters</strong><span>The risk window is an urgency signal; staff still inspect condition at pickup.</span></div>
              <div className="briefing-detail"><strong>Planning guardrail</strong><span>The full offer exceeds long-term refrigerated headroom, so capacity and staging are checked before approval.</span></div>
            </DetailsAccordion>
          </Panel>

          <Panel title="Expiration risk" className="risk-panel" action={<Link className="panel-link" href="/donations">View all inventory</Link>}>
            <div className="risk-list">
              {expirationRiskItems.slice(0, 3).map((item) => <div className={`risk-row risk-${item.risk.toLowerCase()}`} key={item.product}><strong>{item.product}</strong><span>{item.quantityLb.toLocaleString()} lb</span><span>{item.timing}</span><span className="risk-badge">{item.risk}</span></div>)}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
