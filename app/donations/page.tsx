import Link from "next/link";
import { Archive, ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import {
  donation,
  donor,
  historicalDonationOffers,
} from "@/data/seed/scenario";

export default function DonationsPage() {
  return (
    <>
      <PageHeader
        title="Donations"
        subtitle="Review urgent offers before operational planning."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Donations" }]}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        actions={<Link className="button button-primary" href="/donations/new"><Plus size={16} aria-hidden="true" />New donation</Link>}
      />
      <div className="page-content list-page">
        <Panel
          title="Active offers"
          action={<span className="panel-meta-label">1 operational offer</span>}
        >
          <div className="record-list">
            <Link className="record-row" href="/donations/DON-104">
              <span className="record-rail red" />
              <span><strong>{donation.productDescription}</strong><small>{donation.id} · {donor.name}</small></span>
              <span><small>Quantity</small><strong>{donation.quantityLb.toLocaleString()} lb</strong></span>
              <span><small>Pickup</small><strong>Before 1:00 PM</strong></span>
              <span className="plain-status plain-status-amber">Ready for planning</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </Panel>

        <Panel
          title="Recent offers"
          action={<span className="panel-meta-label">History · display only</span>}
        >
          <div className="record-list">
            {historicalDonationOffers.map((offer) => (
              <article className="record-row record-row-static" key={offer.id}>
                <span className={`record-rail ${offer.tone}`} />
                <span>
                  <strong>{offer.productDescription}</strong>
                  <small>{offer.id} · {offer.donorName} · {offer.receivedLabel}</small>
                </span>
                <span>
                  <small>Quantity</small>
                  <strong>{offer.quantityLb.toLocaleString()} lb · {offer.temperatureClass}</strong>
                </span>
                <span>
                  <small>Outcome</small>
                  <strong>{offer.outcomeLabel}</strong>
                </span>
                <span className={`plain-status plain-status-${offer.tone}`}>
                  {offer.statusLabel}
                </span>
                <Archive size={17} aria-hidden="true" />
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
