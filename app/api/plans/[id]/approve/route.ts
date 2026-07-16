import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createApprovalAuditEvent, createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { applyCanonicalAllocationEdit, generatePlanSet } from "@/domain/planning/generate-plans";
import { validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import { PlanOptionSchema } from "@/domain/schemas/core";

const RequestSchema = z.object({
  optionId: z.string(),
  option: PlanOptionSchema.optional(),
  approverId: z.literal("demo_user"),
  reason: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  const set = generatePlanSet();
  if (id !== set.id) return NextResponse.json(apiFailure("NOT_FOUND", `Plan set ${id} was not found.`), { status: 404 });
  if (!body.success) return NextResponse.json(apiFailure("VALIDATION_ERROR", "A plan option and demo_user approver are required."), { status: 400 });
  const canonicalPlan = set.options.find((option) => option.id === body.data.optionId);
  if (!canonicalPlan) return NextResponse.json(apiFailure("NOT_FOUND", `Option ${body.data.optionId} was not found.`), { status: 404 });
  if (body.data.option && (body.data.option.id !== body.data.optionId || body.data.option.planSetId !== set.id)) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "The submitted option does not belong to this plan set."), { status: 400 });
  }
  const normalizedPlan = body.data.option
    ? applyCanonicalAllocationEdit(canonicalPlan, body.data.option)
    : canonicalPlan;
  if (!normalizedPlan) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Only quantities on the canonical allocation rows may be edited."), { status: 400 });
  }
  const validation = validatePlanOption(normalizedPlan, scenarioValidationContext);
  if (!validation.approvable) return NextResponse.json(apiFailure("PLAN_NOT_APPROVABLE", validation.errors.join(" ")), { status: 409 });
  const approvedPlan = { ...normalizedPlan, status: "approved" as const };
  return NextResponse.json(apiSuccess({
    approvedPlan,
    packingPlan: createPackingPlan(approvedPlan),
    mission: createMission(approvedPlan),
    auditEvent: createApprovalAuditEvent(normalizedPlan, body.data.reason),
  }));
}
