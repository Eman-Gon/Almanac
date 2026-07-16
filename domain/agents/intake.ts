import { z } from "zod";
import { baselineAgentRun, donation as seededDonation, donor } from "@/data/seed/scenario";
import {
  ConfidenceSchema,
  DonationOfferSchema,
  ExtractedFieldSchema,
  ISODateTimeSchema,
  TemperatureClassSchema,
  TimeWindowSchema,
} from "@/domain/schemas/core";
import type { AgentRun, Confidence, DonationOffer } from "@/domain/types";

const DEFAULT_BASE_URL = "https://api.venice.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 8_000;

const VeniceConfigSchema = z.object({
  provider: z.literal("venice"),
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
  model: z.string().min(1),
  timeoutMs: z.number().int().min(1_000).max(30_000),
});

const IntakeExtractionSchema = z.object({
  productDescription: z.string().min(1).nullable(),
  quantityLb: z.number().positive().nullable(),
  temperatureClass: TemperatureClassSchema.nullable(),
  pickupWindow: TimeWindowSchema.nullable(),
  estimatedRiskDeadline: ISODateTimeSchema.nullable(),
  conditionNotes: z.string().min(1).nullable(),
  fields: z.array(ExtractedFieldSchema),
  followUpQuestions: z.array(z.string().min(1)),
  confidence: ConfidenceSchema,
});

const VeniceResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().min(1),
      }),
    }),
  ).min(1),
});

type IntakeRequest = {
  sourceText: string;
  donorId: string;
};

export type IntakeResult = {
  donation: DonationOffer;
  agentRun: AgentRun;
  fallbackUsed: boolean;
  warnings: string[];
  followUpQuestions: string[];
};

type VeniceConfig = z.infer<typeof VeniceConfigSchema>;

export class IntakeAgentError extends Error {
  constructor(
    readonly code: "AGENT_UNAVAILABLE" | "AGENT_TIMEOUT" | "INVALID_AGENT_OUTPUT" | "MISSING_REQUIRED_FIELD",
    message: string,
  ) {
    super(message);
    this.name = "IntakeAgentError";
  }
}

function readVeniceConfig(): VeniceConfig | null {
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const parsed = VeniceConfigSchema.safeParse({
    provider: process.env.LLM_PROVIDER ?? "venice",
    apiKey: process.env.VENICE_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.VENICE_BASE_URL ?? process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
    model: process.env.LLM_MODEL,
    timeoutMs,
  });

  return parsed.success ? parsed.data : null;
}

function fallbackResult(
  input: IntakeRequest,
  errorCode: IntakeAgentError["code"],
  warning: string,
): IntakeResult {
  const isSeededScenario =
    input.donorId === seededDonation.donorId &&
    input.sourceText.trim() === seededDonation.sourceText.trim();
  if (!isSeededScenario) {
    throw new IntakeAgentError(
      errorCode,
      "The offer could not be safely extracted without inventing operational facts.",
    );
  }

  return {
    donation: DonationOfferSchema.parse({
      ...seededDonation,
      sourceText: input.sourceText,
      donorId: input.donorId,
    }),
    agentRun: {
      ...baselineAgentRun,
      status: "fallback_used",
      errorCode,
    },
    fallbackUsed: true,
    warnings: [warning],
    followUpQuestions: [],
  };
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  return JSON.parse(withoutFence);
}

function buildPrompt(sourceText: string, schemaReminder = false): string {
  return [
    "You are ChoiceGrid's bounded donation-intake extractor.",
    "Extract only facts explicitly stated in the donor message.",
    "Do not accept or reject the donation, certify food safety, invent an address, or guess a quantity.",
    "Use pounds for quantity only when pounds are explicit or an explicit conversion is present.",
    "Use ISO 8601 timestamps with offsets. The demo reference time is 2026-07-15T10:45:00-07:00.",
    "For unknown or ambiguous values, use null, low/unknown confidence, needsConfirmation=true, and a follow-up question.",
    "Return JSON only with exactly these keys:",
    '{"productDescription":string|null,"quantityLb":number|null,"temperatureClass":"ambient"|"refrigerated"|"frozen"|null,"pickupWindow":{"start":string,"end":string}|null,"estimatedRiskDeadline":string|null,"conditionNotes":string|null,"fields":[{"field":string,"value":unknown,"confidence":"high"|"medium"|"low"|"unknown","sourceSpan":string,"needsConfirmation":boolean}],"followUpQuestions":string[],"confidence":"high"|"medium"|"low"|"unknown"}',
    schemaReminder ? "Your previous response was invalid. Follow the JSON schema exactly and return no Markdown." : "",
    `Donor message: ${JSON.stringify(sourceText)}`,
  ].filter(Boolean).join("\n");
}

async function requestExtraction(
  config: VeniceConfig,
  sourceText: string,
  schemaReminder: boolean,
): Promise<z.infer<typeof IntakeExtractionSchema>> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: buildPrompt(sourceText, schemaReminder),
        },
      ],
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`VENICE_HTTP_${response.status}`);
  }

  const payload = VeniceResponseSchema.parse(await response.json());
  return IntakeExtractionSchema.parse(extractJson(payload.choices[0].message.content));
}

function buildDonation(
  input: IntakeRequest,
  extraction: z.infer<typeof IntakeExtractionSchema>,
): DonationOffer | null {
  if (
    !extraction.productDescription ||
    !extraction.quantityLb ||
    !extraction.temperatureClass
  ) {
    return null;
  }

  const knownDonorLocation = input.donorId === donor.id ? donor.location : null;
  const locationField = knownDonorLocation
    ? [{
        field: "pickupLocation",
        value: knownDonorLocation.address,
        confidence: "high" as const,
        sourceSpan: "Loaded from confirmed donor profile",
        needsConfirmation: false,
      }]
    : [];
  const needsConfirmation =
    !knownDonorLocation ||
    !extraction.pickupWindow ||
    extraction.followUpQuestions.length > 0 ||
    extraction.fields.some((field) => field.needsConfirmation);

  const candidate = {
    ...seededDonation,
    donorId: input.donorId,
    sourceText: input.sourceText,
    productDescription: extraction.productDescription,
    quantityLb: extraction.quantityLb,
    temperatureClass: extraction.temperatureClass,
    pickupLocation: knownDonorLocation,
    pickupWindow: extraction.pickupWindow,
    estimatedRiskDeadline: extraction.estimatedRiskDeadline,
    conditionNotes: extraction.conditionNotes ?? undefined,
    status: needsConfirmation ? "needs_confirmation" as const : "ready_for_planning" as const,
    extractedFields: [...extraction.fields, ...locationField],
    updatedAt: new Date().toISOString(),
  };

  const parsed = DonationOfferSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export async function parseDonationOffer(input: IntakeRequest): Promise<IntakeResult> {
  const config = readVeniceConfig();
  if (!config) {
    return fallbackResult(
      input,
      "AGENT_UNAVAILABLE",
      "Venice is not configured; the validated seeded extraction was used.",
    );
  }

  const startedAt = new Date().toISOString();
  let extraction: z.infer<typeof IntakeExtractionSchema> | null = null;

  try {
    extraction = await requestExtraction(config, input.sourceText, false);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      try {
        extraction = await requestExtraction(config, input.sourceText, true);
      } catch {
        return fallbackResult(
          input,
          "INVALID_AGENT_OUTPUT",
          "Venice returned invalid structured output twice; the validated seeded extraction was used.",
        );
      }
    } else {
      const code = error instanceof Error && error.name === "TimeoutError"
        ? "AGENT_TIMEOUT"
        : "AGENT_UNAVAILABLE";
      return fallbackResult(
        input,
        code,
        "Venice was unavailable; the validated seeded extraction was used.",
      );
    }
  }

  const parsedDonation = extraction ? buildDonation(input, extraction) : null;
  if (!extraction || !parsedDonation) {
    return fallbackResult(
      input,
      "MISSING_REQUIRED_FIELD",
      "Required donation facts were missing or invalid; the validated seeded extraction was used.",
    );
  }

  const confidence: Confidence = extraction.confidence;
  return {
    donation: parsedDonation,
    agentRun: {
      id: `RUN-${crypto.randomUUID()}`,
      agentType: "intake",
      entityId: parsedDonation.id,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "success",
      confidence,
      modelOrRuleset: `venice:${config.model}`,
    },
    fallbackUsed: false,
    warnings: [],
    followUpQuestions: extraction.followUpQuestions,
  };
}
