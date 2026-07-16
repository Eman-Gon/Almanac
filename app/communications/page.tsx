import { CommunicationCenter } from "@/components/communications/communication-center";
import { PageHeader } from "@/components/layout/page-header";

export default function CommunicationsPage() {
  return (
    <>
      <PageHeader
        title="Partner Communications"
        subtitle="Request a human-approved Vapi test call or SMS update for urgent information."
      />
      <div className="page-content">
        <CommunicationCenter />
      </div>
    </>
  );
}
