import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { setPackingBatchCompletion } from "@/domain/execution/create-execution";
import { PackingPlanSchema } from "@/domain/schemas/core";

const RequestSchema = z.object({
  batchId: z.string().min(1),
  complete: z.boolean().default(true),
  packingPlan: PackingPlanSchema,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "PKG-104" && id !== "PKG-105") {
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
  const batch = packingPlan.batches.find((candidate) => candidate.id === body.data.batchId);
  if (!batch) {
    return NextResponse.json(apiFailure("NOT_FOUND", `Packing batch ${body.data.batchId} was not found.`), { status: 404 });
  }
  if (packingPlan.status === "ready") {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Start the packing plan before changing batch completion."), { status: 409 });
  }
  if ((batch.status === "complete") === body.data.complete) {
    return NextResponse.json(apiSuccess({ packingPlan, changed: false, auditEvent: null }));
  }

  return NextResponse.json(apiSuccess({
    packingPlan: setPackingBatchCompletion(
      packingPlan,
      body.data.batchId,
      body.data.complete,
    ),
    changed: true,
    auditEvent: {
      id: `AUD-PKG-${body.data.batchId}`,
      eventType: body.data.complete ? "packing_batch_completed" : "packing_batch_reopened",
      entityType: "PackingBatch",
      entityId: body.data.batchId,
      actorType: "human",
      actorId: "demo_user",
      occurredAt: id === "PKG-105"
        ? "2026-07-15T11:19:30-07:00"
        : "2026-07-15T10:53:00-07:00",
    },
  }));
}
