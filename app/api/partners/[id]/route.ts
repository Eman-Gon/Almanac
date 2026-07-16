import { NextResponse } from "next/server";
import { partners } from "@/data/seed/scenario";
import { apiFailure, apiSuccess } from "@/domain/api/response";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const partner = partners.find((item) => item.id === id);
  if (!partner) return NextResponse.json(apiFailure("NOT_FOUND", `Partner ${id} was not found.`), { status: 404 });
  return NextResponse.json(apiSuccess(partner));
}
