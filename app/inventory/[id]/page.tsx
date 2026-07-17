import { notFound } from "next/navigation";
import { InventoryLotDetailClient } from "@/components/inventory/inventory-lot-detail-client";

export default async function InventoryLotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "LOT-104") notFound();

  return <InventoryLotDetailClient />;
}
