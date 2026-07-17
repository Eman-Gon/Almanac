import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { PlanOptionSchema } from "@/domain/schemas/core";
import { approvePlanTransition } from "@/domain/workflow/transitions";

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
  const transition = approvePlanTransition({ planSetId: id, optionId: body.data.optionId, submittedOption: body.data.option, reason: body.data.reason });
  if (!transition.ok) return NextResponse.json(apiFailure(transition.code, transition.message), { status: transition.code === "NOT_FOUND" ? 404 : transition.code === "PLAN_NOT_APPROVABLE" ? 409 : 400 });
  const { approvedPlan, packingPlan, mission, auditEvents } = transition.value;
  return NextResponse.json(apiSuccess({
    approvedPlan,
    packingPlan,
    mission,
    auditEvent: auditEvents[0],
  }));
}
