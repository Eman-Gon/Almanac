"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  PackageOpen,
  Clock3,
  ExternalLink,
  Snowflake,
  Truck,
} from "lucide-react";
import {
  backgroundMissions,
  expirationRiskItems,
  scenario,
} from "@/data/seed/scenario";
import { PageHeader } from "@/components/layout/page-header";
import { NetworkMap } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { StatusTag } from "@/components/shared/status-tag";
import { getDashboardSummary } from "@/domain/dashboard/summary";
import { useDemoState } from "@/state/demo-state";

const summary = getDashboardSummary();

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "red" | "amber" | "blue" | "green";
  icon: typeof AlertTriangle;
}) {
  return (
    <article className="kpi-card">
      <span className={`kpi-icon kpi-${tone}`}>
        <Icon size={23} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <div>
        <span className="kpi-label">{label}</span>
        <strong className={`kpi-value text-${tone}`}>{value}</strong>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { state } = useDemoState();
  const recovered = state.stage === "recovered";
  const activeMissionId = recovered ? "MSN-105" : "MSN-104";

  return (
    <>
      <PageHeader
        title="Operations Control Tower"
        actions={
          <div className="header-meta">
            <span><CalendarDays size={17} aria-hidden="true" />{scenario.currentDateLabel}</span>
            <span className="service-available"><CheckCircle2 size={17} aria-hidden="true" />All planning services available</span>
          </div>
        }
      />

      <div className="page-content dashboard-page">
        <section className="urgent-alert" aria-labelledby="urgent-alert-title">
          <div className="urgent-alert-icon"><PackageOpen size={27} aria-hidden="true" /></div>
          <div className="urgent-alert-title" id="urgent-alert-title">Urgent donation offer</div>
          <div className="urgent-alert-detail"><strong>1,200 lb</strong> strawberries</div>
          <div className="urgent-alert-detail">Pickup required before <strong>1:00 PM</strong></div>
          <Link className="button button-danger" href="/donations/DON-104">
            Open donation
          </Link>
          <ArrowRight size={20} aria-hidden="true" />
        </section>

        {recovered ? (
          <div className="inline-success" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            Recovery approved. Mission MSN-105 now carries the Strawberry Rescue plan.
            <Link href="/impact">View updated impact</Link>
          </div>
        ) : null}

        <section className="kpi-grid" aria-label="Operational summary">
          <KpiCard label="Urgent offers" value={String(summary.urgentOffers)} tone="red" icon={AlertTriangle} />
          <KpiCard label="At high expiration risk" value={`${summary.poundsAtHighExpirationRisk.toLocaleString()} lb`} tone="amber" icon={Clock3} />
          <KpiCard label="Refrigerated capacity used" value={`${summary.refrigeratedCapacityUsedPct}%`} tone="blue" icon={Snowflake} />
          <KpiCard label="Open missions" value={String(summary.openMissions)} tone="green" icon={Truck} />
        </section>

        <div className="dashboard-main-grid">
          <Panel
            title="Active missions"
            action={<Link className="panel-link" href={`/missions/${activeMissionId}`}>Open strawberry mission</Link>}
            className="missions-panel"
          >
            <div className="table-scroll">
              <table className="data-table missions-table">
                <thead>
                  <tr><th>Mission</th><th>Route</th><th>Load</th><th>Window</th><th>Status</th><th><span className="sr-only">Open</span></th></tr>
                </thead>
                <tbody>
                  {backgroundMissions.map((mission) => (
                    <tr key={mission.id} className={`row-rail-${mission.tone}`}>
                      <td><strong>{mission.id}</strong><span>{mission.name}</span></td>
                      <td>{mission.route}</td>
                      <td>{mission.load}</td>
                      <td>{mission.window}</td>
                      <td><StatusTag tone={mission.tone}>{mission.status}</StatusTag></td>
                      <td><ArrowRight size={16} aria-hidden="true" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Network status"
            action={<Link className="panel-link" href="/map">View full map <ExternalLink size={14} aria-hidden="true" /></Link>}
            className="network-panel"
          >
            <NetworkMap />
          </Panel>
        </div>

        <div className="dashboard-lower-grid">
          <Panel title="Overnight briefing" className="briefing-panel">
            <ul className="briefing-list">
              <li>High-risk strawberries expire today—prioritize DON-104 and confirm on-time pickup.</li>
              <li>Refrigerated capacity is tight—avoid new cold pickups after 11:00 AM unless urgent.</li>
            </ul>
            <div className="source-label">Seeded scenario briefing</div>
          </Panel>

          <Panel title="Expiration risk" className="risk-panel">
            <div className="risk-list">
              {expirationRiskItems.map((item) => (
                <div className={`risk-row risk-${item.risk.toLowerCase()}`} key={item.product}>
                  <strong>{item.product}</strong>
                  <span>{item.quantityLb.toLocaleString()} lb</span>
                  <span>{item.timing}</span>
                  <span>{item.risk}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
