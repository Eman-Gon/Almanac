import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";

const RequestSchema = z.object({
  type: z.literal("partner_canceled"),
  affectedEntityId: z.literal("PAR-002"),
  details: z.object({ reason: z.string().min(1) }),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (id !== "MSN-104") return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Only MSN-104 can use the seeded cancellation fixture."), { status: 409 });
  if (!body.success) return NextResponse.json(apiFailure("VALIDATION_ERROR", "The primary disruption must cancel PAR-002 with a reason."), { status: 400 });
  return NextResponse.json(apiSuccess({
    disruption: { id: "DSP-001", missionId: id, ...body.data, affectedQuantityLb: 320, status: "plan_generated" },
    replacementPlan: createRecoveryOption(generatePlanSet().options[2]),
  }));
}
