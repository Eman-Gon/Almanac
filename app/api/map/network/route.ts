import { NextResponse } from "next/server";
import { donor, partners, vehicles, warehouse } from "@/data/seed/scenario";
import { apiSuccess } from "@/domain/api/response";
import { createMission } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";

export function GET() {
  const plan = generatePlanSet().options[2];
  return NextResponse.json(apiSuccess({ projection: "seed_preview_not_persisted", donor, warehouse, partners, vehicles, route: createMission(plan).routeLegs }));
}
