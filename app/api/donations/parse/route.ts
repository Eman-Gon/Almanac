import { NextResponse } from "next/server";
import { z } from "zod";
import { IntakeAgentError, parseDonationOffer } from "@/domain/agents/intake";
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

  try {
    const result = await parseDonationOffer(parsed.data);
    return NextResponse.json(apiSuccess(result));
  } catch (error) {
    if (error instanceof IntakeAgentError) {
      const status = error.code === "MISSING_REQUIRED_FIELD" ? 422 : 503;
      return NextResponse.json(
        apiFailure(error.code, error.message, status === 503),
        { status },
      );
    }
    return NextResponse.json(
      apiFailure("AGENT_UNAVAILABLE", "Donation extraction failed.", true),
      { status: 503 },
    );
  }
}
