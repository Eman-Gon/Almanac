import { NextResponse } from "next/server";
import {
  baselineAuditEvents,
  baselineInventoryAgentRun,
  partners,
  productLot,
  warehouse,
} from "@/data/seed/scenario";
import { apiFailure, apiSuccess } from "@/domain/api/response";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== productLot.id) {
    return NextResponse.json(apiFailure("NOT_FOUND", `Inventory lot ${id} was not found.`), { status: 404 });
  }

  const acceptanceHistory = partners.map((partner) => ({
    partnerId: partner.id,
    partnerName: partner.name,
    currentStatus: partner.status,
    receivingWindows: partner.receivingWindows,
    refrigeratedCapacityAvailableLb: partner.refrigeratedCapacityAvailableLb,
    history: partner.acceptanceHistory.filter((history) => history.category === productLot.category),
  }));

  return NextResponse.json(apiSuccess({
    productLot,
    warehouse,
    acceptanceHistory,
    agentRuns: [baselineInventoryAgentRun],
    auditEvents: baselineAuditEvents,
  }));
}
