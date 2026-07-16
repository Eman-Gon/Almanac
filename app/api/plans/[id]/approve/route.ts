import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createApprovalAuditEvent, createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { validatePlanOption } from "@/domain/planning/quantity";

const RequestSchema = z.object({
  optionId: z.string(),
  approverId: z.literal("demo_user"),
  reason: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  const set = generatePlanSet();
  if (id !== set.id) return NextResponse.json(apiFailure("NOT_FOUND", `Plan set ${id} was not found.`), { status: 404 });
  if (!body.success) return NextResponse.json(apiFailure("VALIDATION_ERROR", "A plan option and demo_user approver are required."), { status: 400 });
  const plan = set.options.find((option) => option.id === body.data.optionId);
  if (!plan) return NextResponse.json(apiFailure("NOT_FOUND", `Option ${body.data.optionId} was not found.`), { status: 404 });
  const validation = validatePlanOption(plan, 1_200);
  if (!validation.approvable) return NextResponse.json(apiFailure("PLAN_NOT_APPROVABLE", validation.errors.join(" ")), { status: 409 });
  const approvedPlan = { ...plan, status: "approved" as const };
  return NextResponse.json(apiSuccess({
    approvedPlan,
    packingPlan: createPackingPlan(approvedPlan),
    mission: createMission(approvedPlan),
    auditEvent: createApprovalAuditEvent(body.data.reason),
  }));
}
