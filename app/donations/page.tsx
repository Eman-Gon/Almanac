import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { donation, donor } from "@/data/seed/scenario";

export default function DonationsPage() {
  return (
    <>
      <PageHeader
        title="Donations"
        subtitle="Review urgent offers before operational planning."
        actions={<Link className="button button-primary" href="/donations/new"><Plus size={16} aria-hidden="true" />New donation</Link>}
      />
      <div className="page-content list-page">
        <Panel title="Active offers">
          <div className="record-list">
            <Link className="record-row" href="/donations/DON-104">
              <span className="record-rail red" />
              <span><strong>{donation.id} · {donation.productDescription}</strong><small>{donor.name}</small></span>
              <span><small>Quantity</small><strong>{donation.quantityLb.toLocaleString()} lb</strong></span>
              <span><small>Pickup</small><strong>Before 1:00 PM</strong></span>
              <span className="plain-status plain-status-amber">Ready for planning</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
