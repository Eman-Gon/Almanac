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
  vi.stubEnv("LLM_BASE_URL", "https://api.venice.ai/api/v1");
  vi.stubEnv("LLM_API_KEY", "test-key");
  vi.stubEnv("LLM_MODEL", "venice-test-model");
  vi.stubEnv("LLM_BACKUP_MODEL", "backup-test-model");
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
    expect(result.execution.source).toBe("deterministic_fallback");
    expect(result.execution.attemptedModels).toEqual([]);
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
    expect(result.execution).toMatchObject({
      source: "primary_model",
      model: "venice-test-model",
      attemptedModels: ["venice-test-model"],
    });
    expect(result.donation.quantityLb).toBe(1_200);
    expect(result.donation.pickupLocation?.address).toBe("1700 Market Street");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.venice.ai/api/v1/chat/completions");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer test-key",
    });
  });

  it("uses the backup model when the primary returns invalid structured output", async () => {
    configureVenice();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(veniceResponse("not-json"))
      .mockResolvedValueOnce(veniceResponse(JSON.stringify(validExtraction)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).model).toBe("backup-test-model");
    expect(result.fallbackUsed).toBe(false);
    expect(result.execution).toMatchObject({
      source: "backup_model",
      model: "backup-test-model",
      attemptedModels: ["venice-test-model", "backup-test-model"],
    });
    expect(result.warnings).toContain("Primary model venice-test-model returned invalid structured output.");
  });

  it("uses the backup model when the primary provider call fails", async () => {
    configureVenice();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(veniceResponse(JSON.stringify(validExtraction)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(result.execution.source).toBe("backup_model");
    expect(result.warnings[0]).toBe("Primary model venice-test-model was unavailable.");
  });

  it("uses the backup model when the primary times out", async () => {
    configureVenice();
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(veniceResponse(JSON.stringify(validExtraction)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(result.execution.source).toBe("backup_model");
    expect(result.warnings[0]).toBe("Primary model venice-test-model timed out.");
  });

  it("uses the backup model when primary output omits required facts", async () => {
    configureVenice();
    const incomplete = {
      ...validExtraction,
      quantityLb: null,
      followUpQuestions: ["How many pounds are available?"],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(veniceResponse(JSON.stringify(incomplete)))
      .mockResolvedValueOnce(veniceResponse(JSON.stringify(validExtraction)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(result.execution.source).toBe("backup_model");
    expect(result.warnings[0]).toBe(
      "Primary model venice-test-model did not return all required donation facts.",
    );
  });

  it("falls back deterministically after both models return invalid output", async () => {
    configureVenice();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(veniceResponse("not-json"))
      .mockResolvedValueOnce(veniceResponse("still-not-json"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).model).toBe("backup-test-model");
    expect(result.fallbackUsed).toBe(true);
    expect(result.agentRun.errorCode).toBe("INVALID_AGENT_OUTPUT");
    expect(result.execution).toMatchObject({
      source: "deterministic_fallback",
      model: "seeded-intake-v1",
      attemptedModels: ["venice-test-model", "backup-test-model"],
    });
  });

  it("retries malformed output on the primary when no backup is configured", async () => {
    configureVenice();
    vi.stubEnv("LLM_BACKUP_MODEL", "");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(veniceResponse("not-json"))
      .mockResolvedValueOnce(veniceResponse(JSON.stringify(validExtraction)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseDonationOffer(input);

    expect(result.execution.source).toBe("primary_model");
    expect(result.execution.attemptedModels).toEqual([
      "venice-test-model",
      "venice-test-model",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).model).toBe("venice-test-model");
  });
});
