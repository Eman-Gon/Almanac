import { z } from "zod";
import { baselineAuditEvents, scenario } from "@/data/seed/scenario";
import {
  createApprovalAuditEvent,
  createMission,
  createPackingPlan,
  getNextCompletableMissionStopId,
  setMissionStopComplete,
  setPackingBatchCompletion,
  startPackingPlan,
} from "@/domain/execution/create-execution";
import {
  applyCanonicalAllocationEdit,
  generatePlanSet,
} from "@/domain/planning/generate-plans";
import {
  createRecoveryOption,
  createRecoveryPackingPlan,
  preserveCompletedMissionWork,
} from "@/domain/recovery/create-recovery";
import {
  AuditEventSchema,
  MissionSchema,
  PackingPlanSchema,
  PlanOptionSchema,
} from "@/domain/schemas/core";
import type { AuditEvent, Mission, PlanOption } from "@/domain/types";

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
    selectedPlanId: "OPT-003",
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
        occurredAt: "2026-07-15T10:49:00-07:00",
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

  const canonical = generatePlanSet().options.find((option) => option.id === plan.id);
  const normalizedPlan = canonical
    ? applyCanonicalAllocationEdit(canonical, plan)
    : null;
  if (!normalizedPlan) return state;

  const approvedPlan: PlanOption = {
    ...normalizedPlan,
    status: "approved",
  };
  const mission = createMission(approvedPlan);
  const packingPlan = createPackingPlan(approvedPlan);
  const lifecycleEvents: AuditEvent[] = [
    createApprovalAuditEvent(normalizedPlan, reason),
    auditEvent({
      id: "AUD-102A",
      eventType: "mission_created",
      entityType: "Mission",
      entityId: mission.id,
      occurredAt: "2026-07-15T10:50:00-07:00",
      newState: { status: "draft", approvedPlanOptionId: approvedPlan.id },
    }),
    auditEvent({
      id: "AUD-102B",
      eventType: "mission_approved",
      entityType: "Mission",
      entityId: mission.id,
      actorType: "human",
      actorId: "demo_user",
      occurredAt: "2026-07-15T10:50:01-07:00",
      previousState: { status: "draft" },
      newState: { status: "approved" },
      reason: reason || "Approved with the selected allocation plan.",
    }),
    auditEvent({
      id: "AUD-102C",
      eventType: "mission_assigned",
      entityType: "Mission",
      entityId: mission.id,
      occurredAt: "2026-07-15T10:50:02-07:00",
      previousState: { status: "approved" },
      newState: {
        status: "assigned",
        vehicleId: mission.vehicleId,
        driverId: mission.driverId,
      },
    }),
  ];

  return {
    ...state,
    stage: "approved",
    selectedPlanId: approvedPlan.id,
    approvedPlan,
    approvalReason: reason,
    packingPlans: { ...state.packingPlans, [packingPlan.id]: packingPlan },
    activePackingPlanId: packingPlan.id,
    missions: { ...state.missions, [mission.id]: mission },
    auditEvents: [...state.auditEvents, ...lifecycleEvents],
  };
}

export function startPacking(state: DemoState, packingPlanId: string): DemoState {
  if (state.stage === "recovered" && packingPlanId !== "PKG-105") return state;
  const currentPackingPlan = state.packingPlans[packingPlanId];
  if (!currentPackingPlan || currentPackingPlan.status === "complete") return state;
  if (currentPackingPlan.status === "in_progress") return state;
  const packingPlan = startPackingPlan(currentPackingPlan);
  return {
    ...state,
    packingPlans: { ...state.packingPlans, [packingPlanId]: packingPlan },
    activePackingPlanId: packingPlanId,
    auditEvents: [
      ...state.auditEvents,
      auditEvent({
        id: `AUD-${packingPlanId}-START`,
        eventType: "packing_started",
        entityType: "PackingPlan",
        entityId: currentPackingPlan.id,
        actorType: "human",
        actorId: "demo_user",
        occurredAt: packingPlanId === "PKG-105"
          ? "2026-07-15T11:19:00-07:00"
          : "2026-07-15T10:52:00-07:00",
        previousState: { status: currentPackingPlan.status },
        newState: { status: "in_progress" },
      }),
    ],
  };
}

export function setPackingBatchComplete(
  state: DemoState,
  packingPlanId: string,
  batchId: string,
  complete: boolean,
): DemoState {
  if (state.stage === "recovered" && packingPlanId !== "PKG-105") return state;
  const currentPackingPlan = state.packingPlans[packingPlanId];
  if (!currentPackingPlan) return state;
  const batch = currentPackingPlan.batches.find((candidate) => candidate.id === batchId);
  if (!batch || (batch.status === "complete") === complete) return state;
  const packingPlan = setPackingBatchCompletion(currentPackingPlan, batchId, complete);
  const transitionNumber = state.auditEvents.filter(
    (event) => event.entityId === batchId,
  ).length + 1;

  return {
    ...state,
    packingPlans: { ...state.packingPlans, [packingPlanId]: packingPlan },
    activePackingPlanId: packingPlanId,
    auditEvents: [
      ...state.auditEvents,
      auditEvent({
        id: `AUD-PKG-${batchId}-${transitionNumber}`,
        eventType: complete ? "packing_batch_completed" : "packing_batch_reopened",
        entityType: "PackingBatch",
        entityId: batchId,
        actorType: "human",
        actorId: "demo_user",
        occurredAt: packingPlanId === "PKG-105"
          ? "2026-07-15T11:19:30-07:00"
          : "2026-07-15T10:53:00-07:00",
        previousState: { status: batch.status },
        newState: { status: complete ? "complete" : "pending", packingPlanStatus: packingPlan.status },
      }),
    ],
  };
}

export function completeMissionStop(
  state: DemoState,
  missionId: string,
  stopId: string,
): DemoState {
  const mission = state.missions[missionId];
  if (!mission) return state;
  if (mission.status !== "assigned" && mission.status !== "in_transit") return state;
  const stop = mission.stops.find((candidate) => candidate.id === stopId);
  if (!stop || stop.status === "complete" || stop.status === "canceled") return state;
  if (getNextCompletableMissionStopId(mission) !== stopId) return state;
  const updatedMission = setMissionStopComplete(mission, stopId);

  return {
    ...state,
    missions: {
      ...state.missions,
      [missionId]: updatedMission,
    },
    auditEvents: [
      ...state.auditEvents,
      auditEvent({
        id: `AUD-${missionId}-${stopId}`,
        eventType:
          stop.locationType === "warehouse" && stop.quantityPickupLb > 0
            ? "warehouse_load_complete"
            : "delivery_complete",
        entityType: "RouteStop",
        entityId: stopId,
        actorType: "human",
        actorId: "demo_user",
        occurredAt: missionId === "MSN-105"
          ? "2026-07-15T11:20:00-07:00"
          : "2026-07-15T11:00:00-07:00",
        previousState: { status: stop.status },
        newState: { status: "complete", missionStatus: updatedMission.status },
      }),
    ],
  };
}

export function triggerPartnerCancellation(state: DemoState): DemoState {
  if (!state.approvedPlan || !state.missions["MSN-104"]) return state;
  if (state.stage !== "approved") return state;

  const partnerId = "PAR-002";
  const affectedQuantityLb = state.approvedPlan.allocations
    .filter((allocation) => allocation.destinationId === partnerId)
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  if (affectedQuantityLb <= 0) return state;
  const originalMission = state.missions["MSN-104"];
  if (originalMission.status !== "assigned" && originalMission.status !== "in_transit") {
    return state;
  }
  const affectedStop = originalMission.stops.find(
    (stop) => stop.locationId === partnerId,
  );
  if (!affectedStop || affectedStop.status === "complete" || affectedStop.status === "canceled") {
    return state;
  }
  const replanningMission: Mission = {
    ...originalMission,
    status: "replanning",
    stops: originalMission.stops.map((stop) =>
      stop.locationId === partnerId
        ? { ...stop, status: "canceled" as const }
        : stop,
    ),
    updatedAt: "2026-07-15T11:18:00-07:00",
  };
  const recoveryOption = createRecoveryOption(state.approvedPlan);

  return {
    ...state,
    stage: "disrupted",
    partnerStatusOverrides: {
      ...state.partnerStatusOverrides,
      [partnerId]: "canceled",
    },
    missions: { ...state.missions, [originalMission.id]: replanningMission },
    disruption: {
      id: "DSP-001",
      partnerId,
      affectedQuantityLb,
      recoveryOption,
    },
    auditEvents: [
      ...state.auditEvents,
      auditEvent({
        id: "AUD-103",
        eventType: "partner_canceled",
        entityType: "PartnerAgency",
        entityId: partnerId,
        actorType: "human",
        actorId: "demo_user",
        occurredAt: "2026-07-15T11:18:00-07:00",
        previousState: { status: "available" },
        newState: { status: "canceled", affectedQuantityLb },
        reason: "Receiving staff unavailable.",
      }),
      auditEvent({
        id: "AUD-103A",
        eventType: "mission_disrupted",
        entityType: "Mission",
        entityId: originalMission.id,
        occurredAt: "2026-07-15T11:18:00-07:00",
        previousState: { status: originalMission.status },
        newState: { status: "disrupted", canceledStopPartnerId: partnerId },
      }),
      auditEvent({
        id: "AUD-103B",
        eventType: "mission_replanning",
        entityType: "Mission",
        entityId: originalMission.id,
        occurredAt: "2026-07-15T11:18:01-07:00",
        previousState: { status: "disrupted" },
        newState: { status: "replanning", recoveryOptionId: recoveryOption.id },
      }),
    ],
  };
}

export function approveRecovery(state: DemoState): DemoState {
  if (!state.disruption || !state.missions["MSN-104"]) return state;
  if (state.stage !== "disrupted") return state;

  const approvedOption: PlanOption = {
    ...state.disruption.recoveryOption,
    status: "approved",
  };
  const originalMissionBeforeSupersession = state.missions["MSN-104"];
  const replacementMission = preserveCompletedMissionWork(
    originalMissionBeforeSupersession,
    createMission(approvedOption, "MSN-105"),
  );
  const originalPackingPlan = state.packingPlans["PKG-104"];
  const replacementPackingPlan = createRecoveryPackingPlan(
    approvedOption,
    originalPackingPlan,
  );
  const originalMission: Mission = {
    ...state.missions["MSN-104"],
    status: "superseded",
    updatedAt: "2026-07-15T11:18:11-07:00",
  };

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
      [originalMission.id]: originalMission,
      [replacementMission.id]: replacementMission,
    },
    auditEvents: [
      ...state.auditEvents,
      auditEvent({
        id: "AUD-104",
        eventType: "recovery_approved",
        entityType: "PlanOption",
        entityId: approvedOption.id,
        actorType: "human",
        actorId: "demo_user",
        occurredAt: "2026-07-15T11:18:11-07:00",
        previousState: {
          missionId: originalMission.id,
          status: "replanning",
          affectedQuantityLb: state.disruption.affectedQuantityLb,
        },
        newState: {
          missionId: replacementMission.id,
          status: "assigned",
          modeledReplanningSeconds: scenario.modeledReplanningSeconds,
        },
        reason: "Approved alternate-partner recovery plan.",
      }),
      auditEvent({
        id: "AUD-104A",
        eventType: "mission_superseded",
        entityType: "Mission",
        entityId: originalMission.id,
        occurredAt: "2026-07-15T11:18:11-07:00",
        previousState: { status: "replanning" },
        newState: {
          status: "superseded",
          replacementMissionId: replacementMission.id,
        },
      }),
      auditEvent({
        id: "AUD-104B",
        eventType: "replacement_mission_assigned",
        entityType: "Mission",
        entityId: replacementMission.id,
        occurredAt: "2026-07-15T11:18:11-07:00",
        newState: {
          status: "assigned",
          supersedesMissionId: originalMission.id,
        },
      }),
    ],
  };
}
