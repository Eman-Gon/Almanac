import { NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createMission } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryAuditEvents, createRecoveryOption } from "@/domain/recovery/create-recovery";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "DSP-001") return NextResponse.json(apiFailure("NOT_FOUND", `Disruption ${id} was not found.`), { status: 404 });
  const option = createRecoveryOption(generatePlanSet().options[2]);
  return NextResponse.json(apiSuccess({ approvedOption: { ...option, status: "approved" }, replacementMission: createMission(option, "MSN-105"), auditEvents: createRecoveryAuditEvents() }));
}
