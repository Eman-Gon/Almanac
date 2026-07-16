import { afterEach, describe, expect, it, vi } from "vitest";
import { IntakeAgentError, parseDonationOffer } from "@/domain/agents/intake";
import { donation } from "@/data/seed/scenario";

const input = {
  sourceText: donation.sourceText,
  donorId: "DNR-001",
};

const validExtraction = {
  productDescription: "Strawberries",
  quantityLb: 1_200,
  temperatureClass: "refrigerated",
  pickupWindow: {
    start: "2026-07-15T10:45:00-07:00",
    end: "2026-07-15T13:00:00-07:00",
  },
  estimatedRiskDeadline: null,
  conditionNotes: null,
  fields: [
    {
      field: "quantityLb",
      value: 1_200,
      confidence: "high",
      sourceSpan: "1,200 pounds",
      needsConfirmation: false,
    },
  ],
  followUpQuestions: [],
  confidence: "high",
};

function veniceResponse(content: string): Response {
  return Response.json({ choices: [{ message: { content } }] });
}

function configureVenice() {
  vi.stubEnv("LLM_PROVIDER", "venice");
  vi.stubEnv("VENICE_BASE_URL", "https://api.venice.ai/api/v1");
  vi.stubEnv("VENICE_API_KEY", "test-key");
  vi.stubEnv("LLM_MODEL", "venice-test-model");
  vi.stubEnv("LLM_TIMEOUT_MS", "8000");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("donation intake agent", () => {
  it("uses the deterministic fallback when Venice is not configured", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    vi.stubEnv("LLM_MODEL", "");

    const result = await parseDonationOffer(input);

    expect(result.fallbackUsed).toBe(true);
    expect(result.agentRun.status).toBe("fallback_used");
    expect(result.agentRun.errorCode).toBe("AGENT_UNAVAILABLE");
    expect(result.donation.sourceText).toBe(input.sourceText);
  });

  it("does not apply seeded facts to an unrelated offer", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    vi.stubEnv("LLM_MODEL", "");

    await expect(parseDonationOffer({
      sourceText: "We may have some frozen meals next week.",
      donorId: "DNR-UNKNOWN",
    })).rejects.toBeInstanceOf(IntakeAgentError);
  });

  it("accepts validated Venice JSON and keeps the API key server-side", async () => {
    configureVenice();
    const fetchMock = vi.fn().mockResolvedValue(
      veniceResponse(JSON.stringify(validExtraction)),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(result.fallbackUsed).toBe(false);
    expect(result.agentRun.status).toBe("success");
    expect(result.agentRun.modelOrRuleset).toBe("venice:venice-test-model");
    expect(result.donation.quantityLb).toBe(1_200);
    expect(result.donation.pickupLocation?.address).toBe("1700 Market Street");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.venice.ai/api/v1/chat/completions");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer test-key",
    });
  });

  it("retries invalid structured output once and then falls back", async () => {
    configureVenice();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(veniceResponse("not-json"))
      .mockResolvedValueOnce(veniceResponse("still-not-json"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.fallbackUsed).toBe(true);
    expect(result.agentRun.errorCode).toBe("INVALID_AGENT_OUTPUT");
  });
});
