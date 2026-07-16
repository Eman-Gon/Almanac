import { NextResponse } from "next/server";
import { baselineAgentRun, baselineAuditEvents, donation } from "@/data/seed/scenario";
import { apiFailure, apiSuccess } from "@/domain/api/response";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== donation.id) {
    return NextResponse.json(apiFailure("NOT_FOUND", `Donation ${id} was not found.`), { status: 404 });
  }
  return NextResponse.json(apiSuccess({ donation, agentRuns: [baselineAgentRun], auditEvents: baselineAuditEvents }));
}
