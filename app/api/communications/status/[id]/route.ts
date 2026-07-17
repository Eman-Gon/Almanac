import { NextResponse } from "next/server";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import { getVapiCallStatus, VapiConfigurationError, VapiRequestError } from "@/domain/communications/vapi";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return NextResponse.json(apiFailure("VALIDATION_ERROR", "The Vapi call ID is invalid."), { status: 400 });
  }

  try {
    return NextResponse.json(apiSuccess(await getVapiCallStatus(id)));
  } catch (error) {
    if (error instanceof VapiConfigurationError) {
      return NextResponse.json(apiFailure(error.code, error.message), { status: 409 });
    }
    if (error instanceof VapiRequestError) {
      return NextResponse.json(apiFailure("VAPI_REQUEST_FAILED", "Vapi call status could not be retrieved.", true), { status: 502 });
    }
    return NextResponse.json(apiFailure("VAPI_UNAVAILABLE", "Vapi call status is unavailable.", true), { status: 503 });
  }
}
