import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { scenarioContext } from "@/domain/planning/scenario-context";

const RequestSchema = z.object({
  inventoryLotId: z.string(),
  scoreConfigVersion: z.string(),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.inventoryLotId !== scenarioContext.productLot.id || parsed.data.scoreConfigVersion !== scenarioContext.scenario.scoreConfigVersion) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", `Expected ${scenarioContext.productLot.id} and ${scenarioContext.scenario.scoreConfigVersion}.`), { status: 400 });
  }
  return NextResponse.json(apiSuccess(generatePlanSet()));
}
