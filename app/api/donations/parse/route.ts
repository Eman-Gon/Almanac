import { NextResponse } from "next/server";
import { z } from "zod";
import { baselineAgentRun, donation } from "@/data/seed/scenario";
import { apiFailure, apiSuccess } from "@/domain/api/response";

const RequestSchema = z.object({
  sourceText: z.string().min(1),
  donorId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      apiFailure("VALIDATION_ERROR", "A donor message and donor ID are required."),
      { status: 400 },
    );
  }

  return NextResponse.json(
    apiSuccess({
      donation: { ...donation, sourceText: parsed.data.sourceText, donorId: parsed.data.donorId },
      agentRun: baselineAgentRun,
      fallbackUsed: true,
    }),
  );
}
