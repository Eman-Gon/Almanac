import { NextResponse } from "next/server";
import { productLot, scenario } from "@/data/seed/scenario";
import { apiSuccess } from "@/domain/api/response";
import { getDashboardSummary } from "@/domain/dashboard/summary";

export function POST() {
  return NextResponse.json(apiSuccess({ scenarioId: scenario.id, productLot, dashboard: getDashboardSummary(), reset: true }));
}
