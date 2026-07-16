import { notFound } from "next/navigation";
import { DecisionRoomClient } from "@/components/plans/decision-room-client";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "PLN-104") notFound();
  return <DecisionRoomClient />;
}
