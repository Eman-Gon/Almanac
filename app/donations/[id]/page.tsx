import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DonationDetailClient } from "@/components/donations/donation-detail-client";

export default async function DonationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "DON-104") notFound();

  return (
    <>
      <PageHeader title="Donation Details" subtitle="Review the original offer and confirm operational facts before planning." />
      <DonationDetailClient />
    </>
  );
}
