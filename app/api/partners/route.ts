import { NextResponse } from "next/server";
import { partners } from "@/data/seed/scenario";
import { apiSuccess } from "@/domain/api/response";

export function GET() {
  return NextResponse.json(apiSuccess(partners));
}
