import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { getNextCompletableMissionStopId, setMissionStopComplete } from "@/domain/execution/create-execution";
import { MissionSchema } from "@/domain/schemas/core";

const RequestSchema = z.object({
  type: z.enum(["pickup_complete", "delivery_complete"]),
  stopId: z.string().min(1),
  mission: MissionSchema,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "MSN-104" && id !== "MSN-105") {
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
  const stop = mission.stops.find((candidate) => candidate.id === body.data.stopId);
  if (!stop) {
    return NextResponse.json(apiFailure("NOT_FOUND", `Mission stop ${body.data.stopId} was not found.`), { status: 404 });
  }
  if (mission.status !== "assigned" && mission.status !== "in_transit") {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", `Mission ${id} cannot complete stops while ${mission.status}.`), { status: 409 });
  }
  if (getNextCompletableMissionStopId(mission) !== body.data.stopId) {
    return NextResponse.json(apiFailure("INVALID_STATE_TRANSITION", "Mission stops must be completed in route order."), { status: 409 });
  }
  const compatibleEvent = body.data.type === "pickup_complete"
    ? stop.quantityPickupLb > 0
    : stop.quantityDropoffLb > 0;
  if (!compatibleEvent) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "Completion type does not match the stop action."), { status: 400 });
  }

  return NextResponse.json(apiSuccess({
    mission: setMissionStopComplete(mission, body.data.stopId),
    event: {
      id: `AUD-${id}-${body.data.stopId}`,
      eventType: body.data.type,
      entityType: "RouteStop",
      entityId: body.data.stopId,
      actorType: "human",
      actorId: "demo_user",
      occurredAt: id === "MSN-105"
        ? "2026-07-15T11:20:00-07:00"
        : "2026-07-15T11:00:00-07:00",
    },
  }));
}
