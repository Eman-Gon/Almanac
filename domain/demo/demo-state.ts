import { z } from "zod";
import { baselineAuditEvents } from "@/data/seed/scenario";
import {
  applyCanonicalAllocationEdit,
  generatePlanSet,
} from "@/domain/planning/generate-plans";
import { scenarioContext } from "@/domain/planning/scenario-context";
import {
  AuditEventSchema,
  MissionSchema,
  PackingPlanSchema,
  PlanOptionSchema,
} from "@/domain/schemas/core";
import {
  approvePlanTransition,
  approveRecoveryTransition,
  completeMissionStopTransition,
  setPackingBatchTransition,
  startPackingTransition,
  triggerPartnerCancellationTransition,
} from "@/domain/workflow/transitions";
import type { AuditEvent, PlanOption } from "@/domain/types";

export const DemoStageSchema = z.enum([
  "initial",
  "plans_generated",
  "approved",
  "disrupted",
  "recovered",
]);

const PartnerStatusSchema = z.enum([
  "available",
  "limited",
  "unavailable",
  "canceled",
]);

const DemoDisruptionSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  affectedQuantityLb: z.number().nonnegative(),
  recoveryOption: PlanOptionSchema,
});

export const DemoStateSchema = z.object({
  version: z.literal(2),
  stage: DemoStageSchema,
  selectedPlanId: z.string(),
  planOverrides: z.record(z.string(), PlanOptionSchema),
  allocationEditReason: z.string(),
  approvedPlan: PlanOptionSchema.nullable(),
  approvalReason: z.string(),
  packingPlans: z.record(z.string(), PackingPlanSchema),
  activePackingPlanId: z.string().nullable(),
  missions: z.record(z.string(), MissionSchema),
  partnerStatusOverrides: z.record(z.string(), PartnerStatusSchema),
  disruption: DemoDisruptionSchema.nullable(),
  auditEvents: z.array(AuditEventSchema),
  fallbackUsed: z.boolean(),
  resetCount: z.number().int().nonnegative(),
}).superRefine((state, context) => {
  const primaryPackingPlanId = scenarioContext.ids.primaryPackingPlanId;
  const recoveryPackingPlanId = scenarioContext.ids.recoveryPackingPlanId;
  const primaryMissionId = scenarioContext.ids.primaryMissionId;
  const recoveryMissionId = scenarioContext.ids.recoveryMissionId;

  function issue(message: string, path: (string | number)[]) {
    context.addIssue({ code: "custom", message, path });
  }

  if (
    state.activePackingPlanId !== null &&
    !state.packingPlans[state.activePackingPlanId]
  ) {
    issue("The active packing plan must reference a persisted packing plan.", [
      "activePackingPlanId",
    ]);
  }

  if (state.stage === "initial" || state.stage === "plans_generated") {
    if (state.approvedPlan !== null) {
      issue("Pre-approval state cannot contain an approved plan.", ["approvedPlan"]);
    }
    if (Object.keys(state.packingPlans).length > 0) {
      issue("Pre-approval state cannot contain packing plans.", ["packingPlans"]);
    }
    if (Object.keys(state.missions).length > 0) {
      issue("Pre-approval state cannot contain missions.", ["missions"]);
    }
    if (state.disruption !== null) {
      issue("Pre-approval state cannot contain a disruption.", ["disruption"]);
    }
    return;
  }

  if (!state.approvedPlan) {
    issue("Post-approval state requires the approved plan.", ["approvedPlan"]);
    return;
  }

  if (state.approvedPlan.status !== "approved") {
    issue("The persisted approved plan must have approved status.", [
      "approvedPlan",
      "status",
    ]);
  }

  const primaryPackingPlan = state.packingPlans[primaryPackingPlanId];
  if (!primaryPackingPlan) {
    issue("Post-approval state requires the primary packing plan.", [
      "packingPlans",
      primaryPackingPlanId,
    ]);
  } else if (primaryPackingPlan.approvedPlanOptionId !== state.approvedPlan.id) {
    issue("The primary packing plan must reference the approved plan.", [
      "packingPlans",
      primaryPackingPlanId,
      "approvedPlanOptionId",
    ]);
  }

  const primaryMission = state.missions[primaryMissionId];
  if (!primaryMission) {
    issue("Post-approval state requires the primary mission.", [
      "missions",
      primaryMissionId,
    ]);
  } else if (primaryMission.approvedPlanOptionId !== state.approvedPlan.id) {
    issue("The primary mission must reference the approved plan.", [
      "missions",
      primaryMissionId,
      "approvedPlanOptionId",
    ]);
  }

  if (state.stage === "approved") {
    if (state.disruption !== null) {
      issue("Approved state cannot contain a disruption before replanning.", [
        "disruption",
      ]);
    }
    if (
      primaryMission &&
      !["assigned", "in_transit", "delivered", "closed"].includes(
        primaryMission.status,
      )
    ) {
      issue("The primary mission status must match an approved active workflow.", [
        "missions",
        primaryMissionId,
        "status",
      ]);
    }
    return;
  }

  if (!state.disruption) {
    issue("Disrupted and recovered state requires the recorded disruption.", [
      "disruption",
    ]);
    return;
  }

  if (state.partnerStatusOverrides[state.disruption.partnerId] !== "canceled") {
    issue("The disrupted partner must remain marked canceled.", [
      "partnerStatusOverrides",
      state.disruption.partnerId,
    ]);
  }

  if (state.stage === "disrupted") {
    if (primaryMission && primaryMission.status !== "replanning") {
      issue("The primary mission must be replanning after a disruption.", [
        "missions",
        primaryMissionId,
        "status",
      ]);
    }
    return;
  }

  if (state.disruption.recoveryOption.status !== "approved") {
    issue("Recovered state requires an approved recovery option.", [
      "disruption",
      "recoveryOption",
      "status",
    ]);
  }
  if (primaryMission && primaryMission.status !== "superseded") {
    issue("The primary mission must be superseded after recovery approval.", [
      "missions",
      primaryMissionId,
      "status",
    ]);
  }

  const recoveryPackingPlan = state.packingPlans[recoveryPackingPlanId];
  if (!recoveryPackingPlan) {
    issue("Recovered state requires the recovery packing plan.", [
      "packingPlans",
      recoveryPackingPlanId,
    ]);
  } else if (
    recoveryPackingPlan.approvedPlanOptionId !== state.disruption.recoveryOption.id
  ) {
    issue("The recovery packing plan must reference the recovery option.", [
      "packingPlans",
      recoveryPackingPlanId,
      "approvedPlanOptionId",
    ]);
  }

  const recoveryMission = state.missions[recoveryMissionId];
  if (!recoveryMission) {
    issue("Recovered state requires the recovery mission.", [
      "missions",
      recoveryMissionId,
    ]);
  } else if (
    recoveryMission.approvedPlanOptionId !== state.disruption.recoveryOption.id
  ) {
    issue("The recovery mission must reference the recovery option.", [
      "missions",
      recoveryMissionId,
      "approvedPlanOptionId",
    ]);
  } else if (
    !["assigned", "in_transit", "delivered", "closed"].includes(
      recoveryMission.status,
    )
  ) {
    issue("The recovery mission status must match an approved recovery workflow.", [
      "missions",
      recoveryMissionId,
      "status",
    ]);
  }
});

export type DemoStage = z.infer<typeof DemoStageSchema>;
export type DemoState = z.infer<typeof DemoStateSchema>;

function auditEvent(
  event: Omit<AuditEvent, "actorType" | "actorId"> &
    Partial<Pick<AuditEvent, "actorType" | "actorId">>,
): AuditEvent {
  return {
    actorType: "system",
    actorId: "choicegrid_demo",
    ...event,
  };
}

export function createInitialDemoState(resetCount = 0): DemoState {
  return {
    version: 2,
    stage: "initial",
    selectedPlanId: scenarioContext.ids.primaryOptionId,
    planOverrides: {},
    allocationEditReason: "",
    approvedPlan: null,
    approvalReason: "",
    packingPlans: {},
    activePackingPlanId: null,
    missions: {},
    partnerStatusOverrides: {},
    disruption: null,
    auditEvents: baselineAuditEvents.map((event) => ({ ...event })),
    fallbackUsed: true,
    resetCount,
  };
}

export const initialDemoState = createInitialDemoState();

export function resolvePlan(state: DemoState, planId = state.selectedPlanId): PlanOption {
  const plan =
    state.planOverrides[planId] ??
    generatePlanSet().options.find((option) => option.id === planId);

  if (!plan) throw new Error(`Plan option ${planId} was not found.`);
  return plan;
}

export function editPlan(
  state: DemoState,
  updatedPlan: PlanOption,
  reason: string,
): DemoState {
  if (state.approvedPlan) return state;

  const previousPlan = resolvePlan(state, updatedPlan.id);
  const canonical = generatePlanSet().options.find(
    (option) => option.id === updatedPlan.id,
  );
  const recalculated = canonical
    ? applyCanonicalAllocationEdit(canonical, updatedPlan)
    : null;
  if (!recalculated) return state;
  const editNumber = state.auditEvents.filter(
    (event) => event.eventType === "plan_allocations_edited",
  ).length + 1;

  return {
    ...state,
    selectedPlanId: recalculated.id,
    planOverrides: {
      ...state.planOverrides,
      [recalculated.id]: recalculated,
    },
    allocationEditReason: reason,
    auditEvents: [
      ...state.auditEvents,
      auditEvent({
        id: `AUD-EDIT-${editNumber}`,
        eventType: "plan_allocations_edited",
        entityType: "PlanOption",
        entityId: recalculated.id,
        actorType: "human",
        actorId: "demo_user",
        occurredAt: scenarioContext.timeline.planEditedAt,
        previousState: {
          allocations: previousPlan.allocations.map(({ destinationId, quantityLb }) => ({
            destinationId,
            quantityLb,
          })),
        },
        newState: {
          allocations: recalculated.allocations.map(({ destinationId, quantityLb }) => ({
            destinationId,
            quantityLb,
          })),
        },
        reason,
      }),
    ],
  };
}

export function approvePlan(
  state: DemoState,
  plan: PlanOption,
  reason: string,
): DemoState {
  if (state.approvedPlan) return state;
  const transition = approvePlanTransition({ planSetId: plan.planSetId, optionId: plan.id, submittedOption: plan, reason });
  if (!transition.ok) return state;
  const { approvedPlan, mission, packingPlan, auditEvents } = transition.value;

  return {
    ...state,
    stage: "approved",
    selectedPlanId: approvedPlan.id,
    approvedPlan,
    approvalReason: reason,
    packingPlans: { ...state.packingPlans, [packingPlan.id]: packingPlan },
    activePackingPlanId: packingPlan.id,
    missions: { ...state.missions, [mission.id]: mission },
    auditEvents: [...state.auditEvents, ...auditEvents],
  };
}

export function startPacking(state: DemoState, packingPlanId: string): DemoState {
  if (state.stage === "recovered" && packingPlanId !== scenarioContext.ids.recoveryPackingPlanId) return state;
  const currentPackingPlan = state.packingPlans[packingPlanId];
  if (!currentPackingPlan) return state;
  const transition = startPackingTransition(currentPackingPlan);
  if (!transition.ok) return state;
  const { packingPlan, auditEvent: event } = transition.value;
  return {
    ...state,
    packingPlans: { ...state.packingPlans, [packingPlanId]: packingPlan },
    activePackingPlanId: packingPlanId,
    auditEvents: [...state.auditEvents, event],
  };
}

export function setPackingBatchComplete(
  state: DemoState,
  packingPlanId: string,
  batchId: string,
  complete: boolean,
): DemoState {
  if (state.stage === "recovered" && packingPlanId !== scenarioContext.ids.recoveryPackingPlanId) return state;
  const currentPackingPlan = state.packingPlans[packingPlanId];
  if (!currentPackingPlan) return state;
  const transition = setPackingBatchTransition(currentPackingPlan, batchId, complete);
  if (!transition.ok || !transition.value.changed || !transition.value.auditEvent) return state;
  const { packingPlan, auditEvent: event } = transition.value;

  return {
    ...state,
    packingPlans: { ...state.packingPlans, [packingPlanId]: packingPlan },
    activePackingPlanId: packingPlanId,
    auditEvents: [...state.auditEvents, event],
  };
}

export function completeMissionStop(
  state: DemoState,
  missionId: string,
  stopId: string,
): DemoState {
  const mission = state.missions[missionId];
  if (!mission) return state;
  const stop = mission.stops.find((candidate) => candidate.id === stopId);
  if (!stop) return state;
  const eventType = stop.quantityPickupLb > 0 ? "pickup_complete" : "delivery_complete";
  const transition = completeMissionStopTransition(mission, stopId, eventType);
  if (!transition.ok) return state;

  return {
    ...state,
    missions: {
      ...state.missions,
      [missionId]: transition.value.mission,
    },
    auditEvents: [...state.auditEvents, transition.value.event],
  };
}

export function triggerPartnerCancellation(state: DemoState): DemoState {
  const originalMission = state.missions[scenarioContext.ids.primaryMissionId];
  if (!state.approvedPlan || !originalMission) return state;
  if (state.stage !== "approved") return state;
  const transition = triggerPartnerCancellationTransition(state.approvedPlan, originalMission, "Receiving staff unavailable.");
  if (!transition.ok) return state;
  const { disruption, originalMission: replanningMission, replacementPlan, auditEvents } = transition.value;

  return {
    ...state,
    stage: "disrupted",
    partnerStatusOverrides: {
      ...state.partnerStatusOverrides,
      [disruption.partnerId]: "canceled",
    },
    missions: { ...state.missions, [originalMission.id]: replanningMission },
    disruption: {
      id: disruption.id,
      partnerId: disruption.partnerId,
      affectedQuantityLb: disruption.affectedQuantityLb,
      recoveryOption: replacementPlan,
    },
    auditEvents: [...state.auditEvents, ...auditEvents],
  };
}

export function approveRecovery(state: DemoState): DemoState {
  const originalMission = state.missions[scenarioContext.ids.primaryMissionId];
  const originalPackingPlan = state.packingPlans[scenarioContext.ids.primaryPackingPlanId];
  if (!state.disruption || !state.approvedPlan || !originalMission || !originalPackingPlan) return state;
  if (state.stage !== "disrupted") return state;
  const transition = approveRecoveryTransition(state.approvedPlan, originalPackingPlan, originalMission, { id: state.disruption.id, missionId: originalMission.id, partnerId: state.disruption.partnerId, affectedQuantityLb: state.disruption.affectedQuantityLb });
  if (!transition.ok) return state;
  const { approvedOption, originalMission: supersededMission, replacementMission, replacementPackingPlan, auditEvents } = transition.value;

  return {
    ...state,
    stage: "recovered",
    disruption: { ...state.disruption, recoveryOption: approvedOption },
    packingPlans: {
      ...state.packingPlans,
      [replacementPackingPlan.id]: replacementPackingPlan,
    },
    activePackingPlanId: replacementPackingPlan.id,
    missions: {
      ...state.missions,
      [supersededMission.id]: supersededMission,
      [replacementMission.id]: replacementMission,
    },
    auditEvents: [...state.auditEvents, ...auditEvents],
  };
}
