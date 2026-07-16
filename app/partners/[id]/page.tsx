import { notFound } from "next/navigation";
import { PartnerProfileClient } from "@/components/partners/partner-profile-client";
import { partners } from "@/data/seed/scenario";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = partners.find((item) => item.id === id);
  if (!partner) notFound();
  return <PartnerProfileClient partner={partner} />;
}
