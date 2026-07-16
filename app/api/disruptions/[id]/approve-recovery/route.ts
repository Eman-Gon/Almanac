import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createMission } from "@/domain/execution/create-execution";
import { validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import {
  createRecoveryAuditEvents,
  createRecoveryOption,
  createRecoveryPackingPlan,
  preserveCompletedMissionWork,
} from "@/domain/recovery/create-recovery";
import { MissionSchema, PackingPlanSchema, PlanOptionSchema } from "@/domain/schemas/core";

const RequestSchema = z.object({
  originalPlan: PlanOptionSchema,
  originalMission: MissionSchema,
  originalPackingPlan: PackingPlanSchema,
  disruption: z.object({
    id: z.literal("DSP-001"),
    missionId: z.literal("MSN-104"),
    partnerId: z.literal("PAR-002"),
    affectedQuantityLb: z.number().positive(),
  }),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "DSP-001") return NextResponse.json(apiFailure("NOT_FOUND", `Disruption ${id} was not found.`), { status: 404 });
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Recovery approval requires the current disruption, approved plan, and replanning mission."), { status: 400 });
  }
  const { disruption, originalMission, originalPackingPlan, originalPlan } = body.data;
  if (
    originalPlan.status !== "approved" ||
    originalMission.id !== disruption.missionId ||
    originalMission.approvedPlanOptionId !== originalPlan.id ||
    originalMission.status !== "replanning" ||
    originalPackingPlan.id !== "PKG-104" ||
    originalPackingPlan.approvedPlanOptionId !== originalPlan.id
  ) {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Recovery can only follow a recorded disruption in replanning state."), { status: 409 });
  }
  const canceledStop = originalMission.stops.find(
    (stop) => stop.locationId === disruption.partnerId,
  );
  if (
    !canceledStop ||
    canceledStop.status !== "canceled" ||
    canceledStop.quantityDropoffLb !== disruption.affectedQuantityLb
  ) {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Recovery requires the affected mission stop to be canceled."), { status: 409 });
  }
  const affectedQuantityLb = originalPlan.allocations
    .filter((allocation) => allocation.destinationId === disruption.partnerId)
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  if (affectedQuantityLb !== disruption.affectedQuantityLb) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Disruption quantity does not match the approved plan."), { status: 400 });
  }
  const option = createRecoveryOption(originalPlan);
  const validation = validatePlanOption(option, scenarioValidationContext);
  if (!validation.approvable) {
    return NextResponse.json(apiFailure("PLAN_NOT_APPROVABLE", validation.errors.join(" ")), { status: 409 });
  }
  const supersededMission = { ...originalMission, status: "superseded" as const };
  const approvedOption = { ...option, status: "approved" as const };
  const replacementMission = preserveCompletedMissionWork(
    originalMission,
    createMission(approvedOption, "MSN-105"),
  );
  return NextResponse.json(apiSuccess({
    approvedOption,
    originalMission: supersededMission,
    replacementMission,
    replacementPackingPlan: createRecoveryPackingPlan(approvedOption, originalPackingPlan),
    auditEvents: createRecoveryAuditEvents(affectedQuantityLb),
  }));
}
