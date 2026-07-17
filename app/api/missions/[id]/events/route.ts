import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { MissionSchema } from "@/domain/schemas/core";
import { scenarioContext } from "@/domain/planning/scenario-context";
import { completeMissionStopTransition } from "@/domain/workflow/transitions";

const RequestSchema = z.object({
  type: z.enum(["pickup_complete", "delivery_complete"]),
  stopId: z.string().min(1),
  mission: MissionSchema,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== scenarioContext.ids.primaryMissionId && id !== scenarioContext.ids.recoveryMissionId) {
    return NextResponse.json(apiFailure("NOT_FOUND", `Mission ${id} was not found.`), { status: 404 });
  }
  const body = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "A completion type and stopId are required."), { status: 400 });
  }
  const mission = body.data.mission;
  if (mission.id !== id) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Mission ID does not match the route."), { status: 400 });
  }
  const transition = completeMissionStopTransition(mission, body.data.stopId, body.data.type);
  if (!transition.ok) return NextResponse.json(apiFailure(transition.code, transition.message), { status: transition.code === "NOT_FOUND" ? 404 : transition.code === "VALIDATION_ERROR" ? 400 : 409 });
  return NextResponse.json(apiSuccess(transition.value));
}
