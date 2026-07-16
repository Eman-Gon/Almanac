import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as sendCommunication } from "@/app/api/communications/test/route";

const baseRequest = {
  channel: "voice",
  toE164: "+14155550123",
  contactName: "Test contact",
  message: "Approved test update.",
  voicemailMessage: "Approved test voicemail.",
  referenceId: "DON-104",
  confirmed: true,
};

function jsonRequest(body: unknown): Request {
  return new Request("http://choicegrid.test/api/communications/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setLiveVapiEnvironment() {
  vi.stubEnv("VAPI_API_KEY", "vapi-test-key");
  vi.stubEnv("VAPI_ASSISTANT_ID", "assistant-test-id");
  vi.stubEnv("VAPI_PHONE_NUMBER_ID", "phone-test-id");
  vi.stubEnv("VAPI_TEST_TO_NUMBER", "+14155550123");
  vi.stubEnv("VAPI_TEST_CALLS_ENABLED", "true");
}

describe("Vapi communication endpoint", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns a preview and makes no external request when live calls are disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendCommunication(jsonRequest(baseRequest));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data).toMatchObject({
      mode: "preview",
      status: "preview_only",
      communicationId: null,
      toMasked: "+14••••0123",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation and an E.164 number", async () => {
    const response = await sendCommunication(jsonRequest({
      ...baseRequest,
      toE164: "555-0100",
      confirmed: false,
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("creates a live voice request with voicemail detection and the approved message", async () => {
    setLiveVapiEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "call-123", status: "queued" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendCommunication(jsonRequest(baseRequest));
    const payload = await response.json();
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    const assistantOverrides = requestBody.assistantOverrides as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(payload.data).toMatchObject({ mode: "live", communicationId: "call-123", status: "queued" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.vapi.ai/call");
    expect(requestBody).toMatchObject({ assistantId: "assistant-test-id", phoneNumberId: "phone-test-id" });
    expect(assistantOverrides).toMatchObject({
      firstMessage: baseRequest.message,
      voicemailMessage: baseRequest.voicemailMessage,
      voicemailDetection: { provider: "vapi", beepMaxAwaitSeconds: 25 },
    });
  });

  it("uses Vapi chat transport for an exact outbound SMS", async () => {
    setLiveVapiEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "chat-123" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendCommunication(jsonRequest({ ...baseRequest, channel: "sms" }));
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    const transport = requestBody.transport as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect((await response.json()).data).toMatchObject({ mode: "live", channel: "sms", communicationId: "chat-123" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.vapi.ai/chat");
    expect(transport).toMatchObject({
      phoneNumberId: "phone-test-id",
      useLLMGeneratedMessageForOutbound: false,
    });
  });

  it("restricts live calls to the configured test number", async () => {
    setLiveVapiEnvironment();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendCommunication(jsonRequest({ ...baseRequest, toE164: "+14155550124" }));

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("VAPI_TEST_NUMBER_NOT_ALLOWED");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
