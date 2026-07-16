import { notFound } from "next/navigation";
import { MissionDetailClient } from "@/components/execution/mission-detail-client";

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "MSN-104" && id !== "MSN-105") notFound();
  return <MissionDetailClient missionId={id} />;
}
