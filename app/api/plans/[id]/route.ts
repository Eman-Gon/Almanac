import { NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { generatePlanSet } from "@/domain/planning/generate-plans";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const planSet = generatePlanSet();
  if (id !== planSet.id) return NextResponse.json(apiFailure("NOT_FOUND", `Plan set ${id} was not found.`), { status: 404 });
  return NextResponse.json(apiSuccess(planSet));
}
