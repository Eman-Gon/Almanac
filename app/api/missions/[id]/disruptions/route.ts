import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";
import { MissionSchema, PlanOptionSchema } from "@/domain/schemas/core";

const RequestSchema = z.object({
  type: z.literal("partner_canceled"),
  affectedEntityId: z.literal("PAR-002"),
  details: z.object({ reason: z.string().min(1) }),
  approvedPlan: PlanOptionSchema,
  mission: MissionSchema,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (id !== "MSN-104" && id !== "MSN-105") return NextResponse.json(apiFailure("NOT_FOUND", `Mission ${id} was not found.`), { status: 404 });
  if (id !== "MSN-104") return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Only MSN-104 can use the seeded cancellation fixture."), { status: 409 });
  if (!body.success) return NextResponse.json(apiFailure("VALIDATION_ERROR", "The primary disruption requires PAR-002, a reason, the approved plan, and its assigned mission."), { status: 400 });
  const originalPlan = body.data.approvedPlan;
  const originalMission = body.data.mission;
  if (
    originalPlan.status !== "approved" ||
    originalMission.id !== id ||
    originalMission.approvedPlanOptionId !== originalPlan.id ||
    (originalMission.status !== "assigned" && originalMission.status !== "in_transit")
  ) {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Disruption requires the current approved plan and assigned mission."), { status: 409 });
  }
  const validation = validatePlanOption(originalPlan, scenarioValidationContext);
  if (!validation.approvable) {
    return NextResponse.json(apiFailure("PLAN_NOT_APPROVABLE", validation.errors.join(" ")), { status: 409 });
  }
  const affectedQuantityLb = originalPlan.allocations
    .filter((allocation) => allocation.destinationId === body.data.affectedEntityId)
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  if (affectedQuantityLb <= 0) {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "The canceled partner has no assigned quantity to recover."), { status: 409 });
  }
  const affectedStop = originalMission.stops.find((stop) => stop.locationId === body.data.affectedEntityId);
  if (
    !affectedStop ||
    affectedStop.quantityDropoffLb !== affectedQuantityLb ||
    affectedStop.status === "complete" ||
    affectedStop.status === "canceled"
  ) {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "The affected stop is not eligible for cancellation."), { status: 409 });
  }
  const replanningMission = {
    ...originalMission,
    status: "replanning" as const,
    stops: originalMission.stops.map((stop) => stop.locationId === body.data.affectedEntityId ? { ...stop, status: "canceled" as const } : stop),
  };
  return NextResponse.json(apiSuccess({
    disruption: { id: "DSP-001", missionId: id, ...body.data, affectedQuantityLb, status: "plan_generated" },
    partner: { id: body.data.affectedEntityId, status: "canceled" },
    originalMission: replanningMission,
    replacementPlan: createRecoveryOption(originalPlan),
  }));
}
