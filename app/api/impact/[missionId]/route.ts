import { NextResponse } from "next/server";
import { scenario } from "@/data/seed/scenario";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createMission } from "@/domain/execution/create-execution";
import { spoilageAvoidancePct, totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";

export async function GET(_request: Request, context: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await context.params;
  if (missionId !== "MSN-104" && missionId !== "MSN-105") return NextResponse.json(apiFailure("NOT_FOUND", `Mission ${missionId} was not found.`), { status: 404 });
  const original = generatePlanSet().options[2];
  const plan = missionId === "MSN-105" ? createRecoveryOption(original) : original;
  const mission = createMission(plan, missionId);
  return NextResponse.json(apiSuccess({
    poundsOffered: 1_200,
    poundsAssignedInTime: plan.metrics.quantityDistributedInTimeLb,
    inspectionHoldLb: plan.inspectionHoldLb,
    estimatedHouseholdsSupported: plan.metrics.estimatedHouseholdsSupported,
    spoilageAvoidancePct: spoilageAvoidancePct(scenario.baselineExpectedSpoilageLb, plan.metrics.expectedSpoilageLb),
    totalMiles: totalRouteMiles(mission.routeLegs),
    replanningTimeSeconds: missionId === "MSN-105" ? scenario.modeledReplanningSeconds : null,
  }));
}
