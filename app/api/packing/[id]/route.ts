import { NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createPackingPlan } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "PKG-104" && id !== "PKG-105") return NextResponse.json(apiFailure("NOT_FOUND", `Packing plan ${id} was not found.`), { status: 404 });
  if (new URL(request.url).searchParams.get("preview") !== "true") {
    return NextResponse.json(apiFailure("STATE_REQUIRED", "Packing state is created by plan or recovery approval. Add preview=true only for a non-persisted seed projection."), { status: 409 });
  }
  const original = generatePlanSet().options[2];
  const plan = id === "PKG-105" ? createRecoveryOption(original) : original;
  return NextResponse.json(apiSuccess({ projection: "seed_preview_not_persisted", packingPlan: createPackingPlan(plan, id) }));
}
