import { notFound } from "next/navigation";
import { PackingPlanClient } from "@/components/execution/packing-plan-client";

export default async function PackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "PKG-104" && id !== "PKG-105") notFound();
  return <PackingPlanClient packingPlanId={id} />;
}
