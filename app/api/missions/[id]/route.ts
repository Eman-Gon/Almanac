import { NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createMission } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const original = generatePlanSet().options[2];
  if (id === "MSN-104") return NextResponse.json(apiSuccess(createMission(original)));
  if (id === "MSN-105") return NextResponse.json(apiSuccess(createMission(createRecoveryOption(original), "MSN-105")));
  return NextResponse.json(apiFailure("NOT_FOUND", `Mission ${id} was not found.`), { status: 404 });
}
