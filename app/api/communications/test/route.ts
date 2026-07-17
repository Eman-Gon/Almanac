import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import {
  sendVapiTestCommunication,
  TestCommunicationRequestSchema,
  VapiConfigurationError,
  VapiRequestError,
} from "@/domain/communications/vapi";

export async function POST(request: Request) {
  const parsed = TestCommunicationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      apiFailure("VALIDATION_ERROR", "A confirmed test communication requires a recipient, channel, message, and E.164 phone number."),
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(apiSuccess(await sendVapiTestCommunication(parsed.data)), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiFailure("VALIDATION_ERROR", "The test communication payload is invalid."), { status: 400 });
    }
    if (error instanceof VapiConfigurationError) {
      return NextResponse.json(apiFailure(error.code, error.message), { status: 409 });
    }
    if (error instanceof VapiRequestError) {
      return NextResponse.json(apiFailure("VAPI_REQUEST_FAILED", "Vapi rejected the test communication request.", true), { status: 502 });
    }
    return NextResponse.json(apiFailure("VAPI_UNAVAILABLE", "The test communication could not be created.", true), { status: 503 });
  }
}
