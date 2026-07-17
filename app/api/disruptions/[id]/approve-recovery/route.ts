import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { MissionSchema, PackingPlanSchema, PlanOptionSchema } from "@/domain/schemas/core";
import { scenarioContext } from "@/domain/planning/scenario-context";
import { approveRecoveryTransition } from "@/domain/workflow/transitions";

const RequestSchema = z.object({
  originalPlan: PlanOptionSchema,
  originalMission: MissionSchema,
  originalPackingPlan: PackingPlanSchema,
  disruption: z.object({
    id: z.string(),
    missionId: z.string(),
    partnerId: z.string(),
    affectedQuantityLb: z.number().positive(),
  }),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== scenarioContext.ids.disruptionId) return NextResponse.json(apiFailure("NOT_FOUND", `Disruption ${id} was not found.`), { status: 404 });
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success || body.data.disruption.id !== scenarioContext.ids.disruptionId || body.data.disruption.missionId !== scenarioContext.ids.primaryMissionId || body.data.disruption.partnerId !== scenarioContext.ids.canceledPartnerId) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Recovery approval requires the current disruption, approved plan, and replanning mission."), { status: 400 });
  }
  const { disruption, originalMission, originalPackingPlan, originalPlan } = body.data;
  const transition = approveRecoveryTransition(originalPlan, originalPackingPlan, originalMission, disruption);
  if (!transition.ok) return NextResponse.json(apiFailure(transition.code, transition.message), { status: transition.code === "VALIDATION_ERROR" ? 400 : 409 });
  const { approvedOption, originalMission: supersededMission, replacementMission, replacementPackingPlan, auditEvents } = transition.value;
  return NextResponse.json(apiSuccess({
    approvedOption,
    originalMission: supersededMission,
    replacementMission,
    replacementPackingPlan,
    auditEvents,
  }));
}
