import { NextResponse } from "next/server";
import { partners, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import { apiSuccess } from "@/domain/api/response";
import { createMission } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";

export function GET() {
  const plan = generatePlanSet().options[2];
  const mission = createMission(plan);
  return NextResponse.json(apiSuccess({
    projection: "seed_preview_not_persisted",
    inventoryLot: productLot,
    origin: warehouse,
    partners,
    vehicles,
    stops: mission.stops,
    route: mission.routeLegs,
  }));
}
