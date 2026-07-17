import { z } from "zod";
import { scenarioContext, type ChoiceGridScenarioContext } from "@/domain/planning/scenario-context";
import {
  ConfidenceSchema,
  EntityIdSchema,
  ISODateTimeSchema,
  PlanOptionSchema,
} from "@/domain/schemas/core";
import type { PartnerAgency, PlanOption } from "@/domain/types";

export const VOICE_OUTREACH_RULESET = "voice-outreach-sim-v1";

const ApprovedPlanSchema = PlanOptionSchema.refine(
  (plan) => plan.status === "approved",
  "A human-approved plan is required before outreach can be previewed.",
);

const OutreachStageSchema = z.enum(["drafted", "approved", "simulated"]);

const OutreachEventSchema = z.object({
  stage: OutreachStageSchema,
  actorType: z.enum(["human", "system"]),
  actorId: EntityIdSchema,
  occurredAt: ISODateTimeSchema,
  note: z.string().min(1),
});

const OutreachRecipientSchema = z.object({
  partnerId: EntityIdSchema,
  partnerName: z.string().min(1),
  city: z.string().min(1),
  plannedQuantityLb: z.number().positive(),
  refrigeratedCapacityAvailableLb: z.number().nonnegative(),
  requestedDemandLb: z.number().nonnegative(),
  receivingWindow: z.object({
    start: ISODateTimeSchema,
    end: ISODateTimeSchema,
  }),
  script: z.string().min(1),
  factsUsed: z.array(z.string().min(1)).min(1),
});

const OutreachResponseSchema = z.object({
  partnerId: EntityIdSchema,
  outcome: z.enum([
    "simulated_acknowledged",
    "simulated_partial",
    "simulated_declined",
  ]),
  acknowledgedQuantityLb: z.number().nonnegative(),
  confidence: ConfidenceSchema,
  source: z.literal("synthetic_fixture"),
  commitmentRecorded: z.literal(false),
  summary: z.string().min(1),
  transcript: z.array(
    z.object({
      speaker: z.enum(["choicegrid", "partner_fixture"]),
      text: z.string().min(1),
    }),
  ).min(2),
});

export const VoiceOutreachPreviewSchema = z.object({
  id: EntityIdSchema,
  mode: z.literal("simulation"),
  status: z.enum(["draft", "approved", "simulated"]),
  provider: z.null(),
  communicationId: z.null(),
  modelOrRuleset: z.literal(VOICE_OUTREACH_RULESET),
  inventoryLotId: EntityIdSchema,
  warehouseId: EntityIdSchema,
  approvedPlanOptionId: EntityIdSchema,
  approvedPlanName: z.string().min(1),
  approvalReason: z.string().min(1).nullable(),
  productName: z.string().min(1),
  temperatureClass: z.string().min(1),
  riskDeadline: ISODateTimeSchema,
  recipients: z.array(OutreachRecipientSchema).min(1),
  responses: z.array(OutreachResponseSchema),
  events: z.array(OutreachEventSchema).min(1),
  warnings: z.array(z.string().min(1)).min(1),
  mutatesOperationalState: z.literal(false),
}).strict().superRefine((preview, context) => {
  if (preview.status === "simulated" && preview.responses.length !== preview.recipients.length) {
    context.addIssue({
      code: "custom",
      message: "A completed simulation requires one synthetic response per recipient.",
      path: ["responses"],
    });
  }
  if (preview.status !== "simulated" && preview.responses.length > 0) {
    context.addIssue({
      code: "custom",
      message: "Responses are unavailable until the preview is simulated.",
      path: ["responses"],
    });
  }
});

export type VoiceOutreachPreview = z.infer<typeof VoiceOutreachPreviewSchema>;

function addSeconds(value: string, seconds: number): string {
  return new Date(Date.parse(value) + seconds * 1_000).toISOString();
}

function partnerFor(
  destinationId: string,
  context: ChoiceGridScenarioContext,
): PartnerAgency {
  const partner = context.partners.find((candidate) => candidate.id === destinationId);
  if (!partner) {
    throw new Error(`Partner ${destinationId} is unavailable for outreach preview.`);
  }
  return partner;
}

function draftScript(
  partner: PartnerAgency,
  quantityLb: number,
  context: ChoiceGridScenarioContext,
): string {
  const lot = context.productLot;
  const warehouse = context.warehouse;
  return [
    `This is the ChoiceGrid automated assistant with a simulated message for ${partner.name}.`,
    `A human-approved plan assigns ${quantityLb.toLocaleString()} pounds of ${lot.productName.toLowerCase()} from ${warehouse.name}.`,
    `The product is ${lot.temperatureClass} and the modeled risk deadline is ${lot.riskDeadline}.`,
    "Please confirm the quantity and receiving window in this simulation.",
    "No inventory, allocation, or mission will change from this preview.",
  ].join(" ");
}

function draftRecipient(
  plan: PlanOption,
  destinationId: string,
  quantityLb: number,
  context: ChoiceGridScenarioContext,
): z.infer<typeof OutreachRecipientSchema> {
  const partner = partnerFor(destinationId, context);
  if (partner.status === "unavailable" || partner.status === "canceled") {
    throw new Error(`Partner ${partner.id} is not available for outreach preview.`);
  }
  const receivingWindow = partner.receivingWindows[0];
  if (!receivingWindow) {
    throw new Error(`Partner ${partner.id} has no validated receiving window.`);
  }
  const requestedDemandLb = partner.demandSignals.find(
    (signal) => signal.category === context.productLot.category,
  )?.desiredQuantityLb ?? 0;

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    city: partner.location.city,
    plannedQuantityLb: quantityLb,
    refrigeratedCapacityAvailableLb: partner.refrigeratedCapacityAvailableLb,
    requestedDemandLb,
    receivingWindow,
    script: draftScript(partner, quantityLb, context),
    factsUsed: [
      `${context.productLot.id}: ${context.productLot.productName}`,
      `${quantityLb} lb from approved option ${plan.id}`,
      `${context.productLot.temperatureClass} handling`,
      `${context.warehouse.id}: ${context.warehouse.name}`,
      `Receiving window ${receivingWindow.start} to ${receivingWindow.end}`,
      `${partner.refrigeratedCapacityAvailableLb} lb compatible cold capacity`,
    ],
  };
}

export function createVoiceOutreachPreview(
  rawPlan: PlanOption,
  context: ChoiceGridScenarioContext = scenarioContext,
): VoiceOutreachPreview {
  const plan = ApprovedPlanSchema.parse(rawPlan);
  const recipients = plan.allocations
    .filter(
      (allocation) =>
        (allocation.destinationType === "partner"
          || allocation.destinationType === "packing_program")
        && allocation.quantityLb > 0,
    )
    .map((allocation) =>
      draftRecipient(
        plan,
        allocation.destinationId,
        allocation.quantityLb,
        context,
      ),
    );

  if (recipients.length === 0) {
    throw new Error("The approved plan has no partner allocations to preview.");
  }

  const draftedAt = plan.planSetId === context.ids.recoveryPlanSetId
    ? context.timeline.recoveryApprovedAt
    : context.timeline.planApprovedAt;

  return VoiceOutreachPreviewSchema.parse({
    id: `OUT-${plan.id}`,
    mode: "simulation",
    status: "draft",
    provider: null,
    communicationId: null,
    modelOrRuleset: VOICE_OUTREACH_RULESET,
    inventoryLotId: context.productLot.id,
    warehouseId: context.warehouse.id,
    approvedPlanOptionId: plan.id,
    approvedPlanName: plan.name,
    approvalReason: null,
    productName: context.productLot.productName,
    temperatureClass: context.productLot.temperatureClass,
    riskDeadline: context.productLot.riskDeadline,
    recipients,
    responses: [],
    events: [
      {
        stage: "drafted",
        actorType: "system",
        actorId: VOICE_OUTREACH_RULESET,
        occurredAt: draftedAt,
        note: "Generated scripts from validated approved-plan and seeded partner facts.",
      },
    ],
    warnings: [
      "Simulation only — no call, text, voicemail, or provider request will be made.",
      "Synthetic responses are not partner commitments and cannot change operational state.",
    ],
    mutatesOperationalState: false,
  });
}

export function approveVoiceOutreachPreview(
  rawPreview: VoiceOutreachPreview,
  reason: string,
  approverId = "demo_user",
): VoiceOutreachPreview {
  const preview = VoiceOutreachPreviewSchema.parse(rawPreview);
  if (preview.status === "simulated" || preview.status === "approved") return preview;
  const approvalReason = reason.trim();
  if (!approvalReason) {
    throw new Error("A reason is required to authorize the outreach simulation.");
  }
  const approvedAt = addSeconds(preview.events[0].occurredAt, 1);

  return VoiceOutreachPreviewSchema.parse({
    ...preview,
    status: "approved",
    approvalReason,
    events: [
      ...preview.events,
      {
        stage: "approved",
        actorType: "human",
        actorId: approverId,
        occurredAt: approvedAt,
        note: `Authorized a local simulation only: ${approvalReason}`,
      },
    ],
  });
}

function simulateResponse(
  recipient: z.infer<typeof OutreachRecipientSchema>,
  partner: PartnerAgency,
): z.infer<typeof OutreachResponseSchema> {
  const capacity = partner.refrigeratedCapacityAvailableLb;
  const unavailable = partner.status === "unavailable" || partner.status === "canceled";
  const acknowledgedQuantityLb = unavailable
    ? 0
    : Math.min(recipient.plannedQuantityLb, capacity);
  const outcome = unavailable
    ? "simulated_declined" as const
    : acknowledgedQuantityLb < recipient.plannedQuantityLb
      ? "simulated_partial" as const
      : "simulated_acknowledged" as const;
  const summary = unavailable
    ? `Synthetic fixture declined the ${recipient.plannedQuantityLb} lb preview because the seeded partner status is ${partner.status}.`
    : outcome === "simulated_partial"
      ? `Synthetic fixture acknowledged ${acknowledgedQuantityLb} of ${recipient.plannedQuantityLb} lb within seeded cold capacity.`
      : `Synthetic fixture acknowledged the full ${recipient.plannedQuantityLb} lb and seeded receiving window.`;

  return {
    partnerId: recipient.partnerId,
    outcome,
    acknowledgedQuantityLb,
    confidence: "unknown",
    source: "synthetic_fixture",
    commitmentRecorded: false,
    summary,
    transcript: [
      { speaker: "choicegrid", text: recipient.script },
      {
        speaker: "partner_fixture",
        text: unavailable
          ? "Synthetic response: our seeded status is unavailable, so we cannot acknowledge this quantity."
          : `Synthetic response: we can acknowledge ${acknowledgedQuantityLb} pounds during the seeded receiving window.`,
      },
      {
        speaker: "choicegrid",
        text: "Thank you. This is an unverified simulation and has not changed the approved plan.",
      },
    ],
  };
}

export function simulateVoiceOutreach(
  rawPreview: VoiceOutreachPreview,
  context: ChoiceGridScenarioContext = scenarioContext,
): VoiceOutreachPreview {
  const preview = VoiceOutreachPreviewSchema.parse(rawPreview);
  if (preview.status === "simulated") return preview;
  if (preview.status !== "approved") {
    throw new Error("Human preview authorization is required before simulation.");
  }
  const responses = preview.recipients.map((recipient) =>
    simulateResponse(recipient, partnerFor(recipient.partnerId, context)),
  );
  const simulatedAt = addSeconds(
    preview.events[preview.events.length - 1].occurredAt,
    1,
  );

  return VoiceOutreachPreviewSchema.parse({
    ...preview,
    status: "simulated",
    responses,
    events: [
      ...preview.events,
      {
        stage: "simulated",
        actorType: "system",
        actorId: VOICE_OUTREACH_RULESET,
        occurredAt: simulatedAt,
        note: `Created ${responses.length} local synthetic responses without contacting a provider.`,
      },
    ],
  });
}
