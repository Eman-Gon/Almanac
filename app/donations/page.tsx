import Link from "next/link";
import { Archive, ArrowRight, Gift, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { donation, donor, historicalDonationOffers } from "@/data/seed/scenario";

export default function DonationsPage() {
  return (
    <>
      <PageHeader
        title="Donations"
        subtitle="Capture incoming donor offers and track their outcomes. Intake never blocks warehouse-release planning."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Donations" }]}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
      <div className="page-content list-page">
        <Panel
          title="Active donation offer"
          action={(
            <Link className="button button-primary" href="/donations/new">
              <PlusCircle size={15} aria-hidden="true" />
              New donation
            </Link>
          )}
        >
          <div className="record-list">
            <Link className="record-row" href={`/donations/${donation.id}`}>
              <span className="record-rail blue" />
              <span>
                <strong>{donation.productDescription}</strong>
                <small>{donation.id} · {donor.name} · {donor.location.city}</small>
              </span>
              <span>
                <small>Offered quantity</small>
                <strong>{donation.quantityLb.toLocaleString()} lb · {donation.temperatureClass}</strong>
              </span>
              <span>
                <small>Pickup window</small>
                <strong>Today · 11:00 AM – 1:00 PM</strong>
              </span>
              <span className="plain-status plain-status-green">Ready for planning</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="guardrail-note">
            <Gift size={18} aria-hidden="true" />
            <div>
              <strong>Donation intake is a separate workflow</strong>
              <span>The interactive release demo starts from inventory already inside the warehouse; parsed offers stay advisory until staff receive them.</span>
            </div>
          </div>
        </Panel>

        <Panel
          title="Recent donation outcomes"
          action={<span className="panel-meta-label">Mock history · display only</span>}
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
                  <small>Offered quantity</small>
                  <strong>{offer.quantityLb.toLocaleString()} lb · {offer.temperatureClass}</strong>
                </span>
                <span>
                  <small>Outcome</small>
                  <strong>{offer.outcomeLabel}</strong>
                </span>
                <span className={`plain-status plain-status-${offer.tone}`}>{offer.statusLabel}</span>
                <Archive size={17} aria-hidden="true" />
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
