import { NextResponse } from "next/server";
import { z } from "zod";
import { scenario } from "@/data/seed/scenario";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { generatePlanSet } from "@/domain/planning/generate-plans";

const RequestSchema = z.object({
  inventoryLotId: z.literal("LOT-104"),
  scoreConfigVersion: z.literal("score-v1"),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", `Expected LOT-104 and ${scenario.scoreConfigVersion}.`), { status: 400 });
  }
  return NextResponse.json(apiSuccess(generatePlanSet()));
}
