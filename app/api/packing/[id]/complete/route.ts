import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { PackingPlanSchema } from "@/domain/schemas/core";
import { scenarioContext } from "@/domain/planning/scenario-context";
import { setPackingBatchTransition } from "@/domain/workflow/transitions";

const RequestSchema = z.object({
  batchId: z.string().min(1),
  complete: z.boolean().default(true),
  packingPlan: PackingPlanSchema,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== scenarioContext.ids.primaryPackingPlanId && id !== scenarioContext.ids.recoveryPackingPlanId) {
    return NextResponse.json(apiFailure("NOT_FOUND", `Packing plan ${id} was not found.`), { status: 404 });
  }
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "batchId and a valid created packing plan are required."), { status: 400 });
  }
  const packingPlan = body.data.packingPlan;
  if (packingPlan.id !== id) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Packing plan ID does not match the route."), { status: 400 });
  }
  const transition = setPackingBatchTransition(packingPlan, body.data.batchId, body.data.complete);
  if (!transition.ok) return NextResponse.json(apiFailure(transition.code, transition.message), { status: transition.code === "NOT_FOUND" ? 404 : 409 });
  return NextResponse.json(apiSuccess(transition.value));
}
