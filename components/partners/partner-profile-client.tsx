"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, MapPinned, Snowflake } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import type { PartnerAgency } from "@/domain/types";
import { useDemoState } from "@/state/demo-state";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatReceivingWindow(partner: PartnerAgency): string {
  const window = partner.receivingWindows[0];
  if (!window) return "Needs confirmation";
  return `${formatTime(window.start)} – ${formatTime(window.end)}`;
}

export function PartnerProfileClient({ partner }: { partner: PartnerAgency }) {
  const { state } = useDemoState();
  const status = state.partnerStatusOverrides[partner.id] ?? partner.status;
  const StatusIcon = status === "available" || status === "limited" ? CheckCircle2 : AlertTriangle;

  return (
    <>
      <PageHeader
        title={partner.name}
        subtitle={`${partner.agencyType.replace("_", " ")} · decision context`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Plans", href: "/plans/PLN-104" }, { label: partner.name }]}
        backHref="/plans/PLN-104"
        backLabel="Back to Plan"
      />
      <div className="page-content partner-page">
        {status === "canceled" ? (
          <div className="disruption-alert" role="status">
            <AlertTriangle size={20} aria-hidden="true" />
            <div><strong>Partner canceled for this mission</strong><span>Receiving staff are unavailable; the original stop and allocation were canceled.</span></div>
          </div>
        ) : null}
        <section className="execution-summary">
          <div><span>Status</span><strong className={status === "available" ? "inline-green" : ""}><StatusIcon size={15} aria-hidden="true" />{status}</strong></div>
          <div><span>Location</span><strong><MapPinned size={15} aria-hidden="true" />{partner.location.city}, CA</strong></div>
          <div><span>Refrigerated capacity</span><strong><Snowflake size={15} aria-hidden="true" />{partner.refrigeratedCapacityAvailableLb} lb</strong></div>
          <div><span>Receiving window</span><strong>{formatReceivingWindow(partner)}</strong></div>
        </section>
        <div className="partner-grid">
          <Panel title="Current demand"><div className="profile-stat"><strong>{partner.demandSignals[0].desiredQuantityLb} lb</strong><span>Confirmed produce demand · {partner.demandSignals[0].urgency} urgency</span></div><div className="profile-list"><p><strong>Accepted categories</strong>{partner.acceptedCategories.join(", ")}</p><p><strong>Preferred usability</strong>{partner.preferredTags.join(", ").replaceAll("_", " ")}</p></div></Panel>
          <Panel title="Decision factors"><div className="factor-grid"><div><strong>{partner.recentServiceGap}</strong><span>Recent service gap</span></div><div><strong>{partner.accessBurden}</strong><span>Access burden</span></div><div><strong>{partner.refusalRisk}</strong><span>Refusal risk</span></div></div><div className="source-label">Scenario indicators are separately inspectable</div></Panel>
          <Panel title="Operational notes"><div className="profile-list">{partner.notes.map((note) => <p key={note.id}><strong>{note.authorRole}</strong>{note.text}</p>)}</div></Panel>
        </div>
        <div className="rail-actions"><Link className="button button-secondary" href={`/map?plan=PLN-104&returnTo=/partners/${partner.id}`}>Open route map</Link><Link className="button button-primary" href="/plans/PLN-104">Return to plan comparison</Link></div>
      </div>
    </>
  );
}
