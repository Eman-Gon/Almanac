import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/domain/api/response";
import {
  getVapiConfiguration,
  sendVapiTestCommunication,
  VapiConfigurationError,
  VapiRequestError,
} from "@/domain/communications/vapi";

const DISRUPTION_MESSAGE =
  "Hi, this is an Almanac delivery alert. Eastside Community Pantry has just canceled its three hundred and twenty pound strawberry allocation because their receiving staff are unavailable. Almanac is drafting a replacement plan to rebalance the delivery to nearby partners, and it needs your approval. Please open the recovery screen to review and approve the new route.";

const VOICEMAIL_MESSAGE =
  "This is an Almanac delivery alert. Eastside Community Pantry canceled its strawberry allocation, so the delivery is being rebalanced. A replacement plan is ready for your approval. Please open Almanac to review.";

export async function POST() {
  const configuration = getVapiConfiguration();

  try {
    const result = await sendVapiTestCommunication({
      channel: "voice",
      toE164: configuration.testToNumber,
      contactName: "Almanac Coordinator",
      message: DISRUPTION_MESSAGE,
      voicemailMessage: VOICEMAIL_MESSAGE,
      referenceId: "MSN-104",
      confirmed: true,
    });
    return NextResponse.json(apiSuccess(result), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        apiFailure(
          "VAPI_TEST_CONFIGURATION_REQUIRED",
          "A valid VAPI_TEST_TO_NUMBER in E.164 format is required for the disruption alert call.",
        ),
        { status: 409 },
      );
    }
    if (error instanceof VapiConfigurationError) {
      return NextResponse.json(apiFailure(error.code, error.message), { status: 409 });
    }
    if (error instanceof VapiRequestError) {
      return NextResponse.json(
        apiFailure("VAPI_REQUEST_FAILED", "Vapi rejected the disruption alert call.", true),
        { status: 502 },
      );
    }
    return NextResponse.json(
      apiFailure("VAPI_UNAVAILABLE", "The disruption alert call could not be created.", true),
      { status: 503 },
    );
  }
}
