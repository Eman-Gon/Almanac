import { NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { createPackingPlan } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== "PKG-104") return NextResponse.json(apiFailure("NOT_FOUND", `Packing plan ${id} was not found.`), { status: 404 });
  return NextResponse.json(apiSuccess(createPackingPlan(generatePlanSet().options[2])));
}
