import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { startPackingPlan } from "@/domain/execution/create-execution";
import { PackingPlanSchema } from "@/domain/schemas/core";

const RequestSchema = z.object({ packingPlan: PackingPlanSchema });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "PKG-104" && id !== "PKG-105") {
    return NextResponse.json(apiFailure("NOT_FOUND", `Packing plan ${id} was not found.`), { status: 404 });
  }
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "A valid created packing plan is required."), { status: 400 });
  }
  const packingPlan = body.data.packingPlan;
  if (packingPlan.id !== id) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Packing plan ID does not match the route."), { status: 400 });
  }
  if (packingPlan.status !== "ready") {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", `Packing plan ${id} cannot start while ${packingPlan.status}.`), { status: 409 });
  }

  return NextResponse.json(apiSuccess({
    packingPlan: startPackingPlan(packingPlan),
    auditEvent: {
      id: `AUD-${id}-START`,
      eventType: "packing_started",
      entityType: "PackingPlan",
      entityId: id,
      actorType: "human",
      actorId: "demo_user",
      occurredAt: id === "PKG-105"
        ? "2026-07-15T11:19:00-07:00"
        : "2026-07-15T10:52:00-07:00",
    },
  }));
}
