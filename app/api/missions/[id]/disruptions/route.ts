import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { MissionSchema, PlanOptionSchema } from "@/domain/schemas/core";
import { scenarioContext } from "@/domain/planning/scenario-context";
import { triggerPartnerCancellationTransition } from "@/domain/workflow/transitions";

const RequestSchema = z.object({
  type: z.literal("partner_canceled"),
  affectedEntityId: z.string(),
  details: z.object({ reason: z.string().min(1) }),
  approvedPlan: PlanOptionSchema,
  mission: MissionSchema,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (id !== scenarioContext.ids.primaryMissionId && id !== scenarioContext.ids.recoveryMissionId) return NextResponse.json(apiFailure("NOT_FOUND", `Mission ${id} was not found.`), { status: 404 });
  if (id !== scenarioContext.ids.primaryMissionId) return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", `Only ${scenarioContext.ids.primaryMissionId} can use the configured cancellation fixture.`), { status: 409 });
  if (!body.success || body.data.affectedEntityId !== scenarioContext.ids.canceledPartnerId) return NextResponse.json(apiFailure("VALIDATION_ERROR", `The primary disruption requires ${scenarioContext.ids.canceledPartnerId}, a reason, the approved plan, and its assigned mission.`), { status: 400 });
  const originalPlan = body.data.approvedPlan;
  const originalMission = body.data.mission;
  const transition = triggerPartnerCancellationTransition(originalPlan, originalMission, body.data.details.reason);
  if (!transition.ok) return NextResponse.json(apiFailure(transition.code, transition.message), { status: transition.code === "VALIDATION_ERROR" ? 400 : 409 });
  const value = transition.value;
  const disruption = {
    id: value.disruption.id,
    missionId: value.disruption.missionId,
    type: value.disruption.type,
    affectedEntityId: value.disruption.affectedEntityId,
    affectedQuantityLb: value.disruption.affectedQuantityLb,
    status: value.disruption.status,
    details: value.disruption.details,
  };
  return NextResponse.json(apiSuccess({
    disruption,
    partner: value.partner,
    originalMission: value.originalMission,
    replacementPlan: value.replacementPlan,
  }));
}
