import { CommunicationCenter } from "@/components/communications/communication-center";
import { PageHeader } from "@/components/layout/page-header";

export default function CommunicationsPage() {
  return (
    <>
      <PageHeader
        title="Partner Outreach Simulator"
        subtitle="Preview one-to-many voice coordination from an approved warehouse-release plan without contacting anyone."
      />
      <div className="page-content">
        <CommunicationCenter />
      </div>
    </>
  );
}
