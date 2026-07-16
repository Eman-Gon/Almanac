import { z } from "zod";

const E164PhoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Use an E.164 phone number such as +14155550123.");

export const CommunicationChannelSchema = z.enum(["voice", "sms"]);

export const TestCommunicationRequestSchema = z.object({
  channel: CommunicationChannelSchema,
  toE164: E164PhoneSchema,
  contactName: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
  voicemailMessage: z.string().trim().min(1).max(1_000).optional(),
  referenceId: z.string().trim().min(1).max(40).default("DON-104"),
  confirmed: z.literal(true),
});

export const CommunicationResultSchema = z.object({
  mode: z.enum(["preview", "live"]),
  channel: CommunicationChannelSchema,
  provider: z.literal("vapi"),
  status: z.string().min(1),
  communicationId: z.string().nullable(),
  toMasked: z.string().optional(),
  messagePreview: z.string().optional(),
  voicemailPreview: z.string().optional(),
  note: z.string().optional(),
  summary: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export type CommunicationChannel = z.infer<typeof CommunicationChannelSchema>;
export type TestCommunicationRequest = z.infer<typeof TestCommunicationRequestSchema>;
export type CommunicationResult = z.infer<typeof CommunicationResultSchema>;

type VapiConfiguration = {
  apiKey: string;
  assistantId: string;
  phoneNumberId: string;
  testToNumber: string;
  liveRequested: boolean;
  liveEnabled: boolean;
  missing: string[];
};

export class VapiConfigurationError extends Error {
  readonly code: "VAPI_TEST_CONFIGURATION_REQUIRED" | "VAPI_TEST_NUMBER_NOT_ALLOWED";

  constructor(
    code: "VAPI_TEST_CONFIGURATION_REQUIRED" | "VAPI_TEST_NUMBER_NOT_ALLOWED",
    message: string,
  ) {
    super(message);
    this.name = "VapiConfigurationError";
    this.code = code;
  }
}

export class VapiRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Vapi request failed with status ${status}.`);
    this.name = "VapiRequestError";
    this.status = status;
  }
}

function envValue(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getVapiConfiguration(): VapiConfiguration {
  const apiKey = envValue("VAPI_API_KEY");
  const assistantId = envValue("VAPI_ASSISTANT_ID");
  const phoneNumberId = envValue("VAPI_PHONE_NUMBER_ID");
  const testToNumber = envValue("VAPI_TEST_TO_NUMBER");
  const missing = [
    !apiKey ? "VAPI_API_KEY" : null,
    !assistantId ? "VAPI_ASSISTANT_ID" : null,
    !phoneNumberId ? "VAPI_PHONE_NUMBER_ID" : null,
    !testToNumber ? "VAPI_TEST_TO_NUMBER" : null,
  ].filter((value): value is string => Boolean(value));
  const liveRequested = envValue("VAPI_TEST_CALLS_ENABLED").toLowerCase() === "true";

  return {
    apiKey,
    assistantId,
    phoneNumberId,
    testToNumber,
    liveRequested,
    liveEnabled: liveRequested && missing.length === 0,
    missing,
  };
}

export function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 6) return "hidden number";
  return `${phoneNumber.slice(0, 3)}••••${phoneNumber.slice(-4)}`;
}

function readString(value: unknown, key: string): string | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}

function readNestedString(value: unknown, parentKey: string, childKey: string): string | null {
  if (typeof value !== "object" || value === null) return null;
  const parent = (value as Record<string, unknown>)[parentKey];
  return readString(parent, childKey);
}

function previewResult(input: TestCommunicationRequest): CommunicationResult {
  return {
    mode: "preview",
    channel: input.channel,
    provider: "vapi",
    status: "preview_only",
    communicationId: null,
    toMasked: maskPhoneNumber(input.toE164),
    messagePreview: input.message,
    voicemailPreview: input.channel === "voice" ? input.voicemailMessage ?? input.message : undefined,
    note: "No message was sent. Enable VAPI_TEST_CALLS_ENABLED and configure the approved test number to make a live test request.",
  };
}

async function requestVapi(
  configuration: VapiConfiguration,
  path: string,
  options: { method: "GET" | "POST"; body?: unknown },
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`https://api.vapi.ai${path}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${configuration.apiKey}`,
        "content-type": "application/json",
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const rawBody = await response.text();
    let body: unknown = null;
    try {
      body = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      body = null;
    }
    if (!response.ok) throw new VapiRequestError(response.status);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function assertLiveConfiguration(
  configuration: VapiConfiguration,
  input: TestCommunicationRequest,
): void {
  if (!configuration.liveRequested) return;
  if (!configuration.liveEnabled) {
    throw new VapiConfigurationError(
      "VAPI_TEST_CONFIGURATION_REQUIRED",
      `Live test calls require: ${configuration.missing.join(", ")}.`,
    );
  }
  if (input.toE164 !== configuration.testToNumber) {
    throw new VapiConfigurationError(
      "VAPI_TEST_NUMBER_NOT_ALLOWED",
      "This demo endpoint only permits the configured VAPI_TEST_TO_NUMBER.",
    );
  }
}

export async function sendVapiTestCommunication(
  rawInput: unknown,
): Promise<CommunicationResult> {
  const input = TestCommunicationRequestSchema.parse(rawInput);
  const configuration = getVapiConfiguration();
  assertLiveConfiguration(configuration, input);

  if (!configuration.liveEnabled) return previewResult(input);

  const response = input.channel === "voice"
    ? await requestVapi(configuration, "/call", {
        method: "POST",
        body: {
          assistantId: configuration.assistantId,
          phoneNumberId: configuration.phoneNumberId,
          customer: { name: input.contactName, number: input.toE164 },
          assistantOverrides: {
            firstMessage: input.message,
            voicemailDetection: { provider: "vapi", beepMaxAwaitSeconds: 25 },
            voicemailMessage: input.voicemailMessage ?? input.message,
          },
        },
      })
    : await requestVapi(configuration, "/chat", {
        method: "POST",
        body: {
          assistantId: configuration.assistantId,
          input: input.message,
          transport: {
            phoneNumberId: configuration.phoneNumberId,
            customer: { name: input.contactName, number: input.toE164 },
            useLLMGeneratedMessageForOutbound: false,
          },
        },
      });

  const communicationId = readString(response, "id") ?? readString(response, "callId");
  return {
    mode: "live",
    channel: input.channel,
    provider: "vapi",
    status: readString(response, "status") ?? (input.channel === "voice" ? "queued" : "sent"),
    communicationId,
    toMasked: maskPhoneNumber(input.toE164),
    messagePreview: input.message,
    voicemailPreview: input.channel === "voice" ? input.voicemailMessage ?? input.message : undefined,
    note: "Vapi accepted the test request. No donation, allocation, or safety decision was made.",
  };
}

export async function getVapiCallStatus(callId: string): Promise<CommunicationResult> {
  const configuration = getVapiConfiguration();
  if (!configuration.liveEnabled) {
    return {
      mode: "preview",
      channel: "voice",
      provider: "vapi",
      status: "preview_only",
      communicationId: callId,
      note: "Live Vapi status is unavailable while test calls are disabled.",
    };
  }

  const response = await requestVapi(configuration, `/call/${encodeURIComponent(callId)}`, { method: "GET" });
  return {
    mode: "live",
    channel: "voice",
    provider: "vapi",
    status: readString(response, "status") ?? "unknown",
    communicationId: callId,
    summary: readNestedString(response, "analysis", "summary") ?? undefined,
    startedAt: readString(response, "startedAt") ?? undefined,
    endedAt: readString(response, "endedAt") ?? undefined,
  };
}
