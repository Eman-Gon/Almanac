import {
  createApprovalAuditEvent,
  createMission,
  createPackingPlan,
  getNextCompletableMissionStopId,
  setMissionStopComplete,
  setPackingBatchCompletion,
  startPackingPlan,
} from "@/domain/execution/create-execution";
import { applyCanonicalAllocationEdit, generatePlanSet } from "@/domain/planning/generate-plans";
import { validatePlanOption } from "@/domain/planning/quantity";
import { scenarioContext, type AlmanacScenarioContext } from "@/domain/planning/scenario-context";
import {
  createRecoveryOptionResult,
  createRecoveryPackingPlan,
  preserveCompletedMissionWork,
} from "@/domain/recovery/create-recovery";
import type { AuditEvent, Mission, PackingPlan, PlanOption } from "@/domain/types";

export type TransitionErrorCode = "NOT_FOUND" | "VALIDATION_ERROR" | "INVALID_STATE_TRANSITION" | "PLAN_NOT_APPROVABLE";
export type TransitionResult<T> = { ok: true; value: T } | { ok: false; code: TransitionErrorCode; message: string };

const fail = (code: TransitionErrorCode, message: string): TransitionResult<never> => ({ ok: false, code, message });
const audit = (event: Omit<AuditEvent, "actorType" | "actorId"> & Partial<Pick<AuditEvent, "actorType" | "actorId">>): AuditEvent => ({ actorType: "system", actorId: "choicegrid_demo", ...event });

export function approvePlanTransition(input: {
  planSetId: string;
  optionId: string;
  submittedOption?: PlanOption;
  reason?: string;
}, context: AlmanacScenarioContext = scenarioContext): TransitionResult<{
  approvedPlan: PlanOption;
  packingPlan: PackingPlan;
  mission: Mission;
  auditEvents: AuditEvent[];
}> {
  const set = generatePlanSet(context);
  if (input.planSetId !== set.id) return fail("NOT_FOUND", `Plan set ${input.planSetId} was not found.`);
  const canonical = set.options.find((option) => option.id === input.optionId);
  if (!canonical) return fail("NOT_FOUND", `Option ${input.optionId} was not found.`);
  if (input.submittedOption && (input.submittedOption.id !== input.optionId || input.submittedOption.planSetId !== set.id)) return fail("VALIDATION_ERROR", "The submitted option does not belong to this plan set.");
  const normalized = input.submittedOption ? applyCanonicalAllocationEdit(canonical, input.submittedOption, context) : canonical;
  if (!normalized) return fail("VALIDATION_ERROR", "Only quantities on the canonical allocation rows may be edited.");
  const validation = validatePlanOption(normalized, context);
  if (!validation.approvable) return fail("PLAN_NOT_APPROVABLE", validation.errors.join(" "));
  const approvedPlan = { ...normalized, status: "approved" as const };
  const packingPlan = createPackingPlan(approvedPlan, context.ids.primaryPackingPlanId, context);
  const mission = createMission(approvedPlan, context.ids.primaryMissionId, context);
  const auditEvents = [
    createApprovalAuditEvent(normalized, input.reason, context),
    audit({ id: "AUD-102A", eventType: "mission_created", entityType: "Mission", entityId: mission.id, occurredAt: context.timeline.planApprovedAt, newState: { status: "draft", approvedPlanOptionId: approvedPlan.id } }),
    audit({ id: "AUD-102B", eventType: "mission_approved", entityType: "Mission", entityId: mission.id, actorType: "human", actorId: "demo_user", occurredAt: context.timeline.missionApprovedAt, previousState: { status: "draft" }, newState: { status: "approved" }, reason: input.reason || "Approved with the selected allocation plan." }),
    audit({ id: "AUD-102C", eventType: "mission_assigned", entityType: "Mission", entityId: mission.id, occurredAt: context.timeline.missionAssignedAt, previousState: { status: "approved" }, newState: { status: "assigned", vehicleId: mission.vehicleId, driverId: mission.driverId } }),
  ];
  return { ok: true, value: { approvedPlan, packingPlan, mission, auditEvents } };
}

export function startPackingTransition(packingPlan: PackingPlan, context: AlmanacScenarioContext = scenarioContext): TransitionResult<{ packingPlan: PackingPlan; auditEvent: AuditEvent }> {
  if (packingPlan.status !== "ready") return fail("INVALID_STATE_TRANSITION", `Packing plan ${packingPlan.id} cannot start while ${packingPlan.status}.`);
  const recovery = packingPlan.id === context.ids.recoveryPackingPlanId;
  return { ok: true, value: {
    packingPlan: startPackingPlan(packingPlan),
    auditEvent: audit({ id: `AUD-${packingPlan.id}-START`, eventType: "packing_started", entityType: "PackingPlan", entityId: packingPlan.id, actorType: "human", actorId: "demo_user", occurredAt: recovery ? context.timeline.recoveryPackingStartedAt : context.timeline.primaryPackingStartedAt, previousState: { status: packingPlan.status }, newState: { status: "in_progress" } }),
  } };
}

export function setPackingBatchTransition(packingPlan: PackingPlan, batchId: string, complete: boolean, context: AlmanacScenarioContext = scenarioContext): TransitionResult<{ packingPlan: PackingPlan; changed: boolean; auditEvent: AuditEvent | null }> {
  const batch = packingPlan.batches.find((candidate) => candidate.id === batchId);
  if (!batch) return fail("NOT_FOUND", `Packing batch ${batchId} was not found.`);
  if (packingPlan.status !== "in_progress" && packingPlan.status !== "complete") {
    return fail("INVALID_STATE_TRANSITION", "Start the packing plan before changing batch completion.");
  }
  if ((batch.status === "complete") === complete) return { ok: true, value: { packingPlan, changed: false, auditEvent: null } };
  const updated = setPackingBatchCompletion(packingPlan, batchId, complete);
  const recovery = packingPlan.id === context.ids.recoveryPackingPlanId;
  const eventType = complete ? "packing_batch_completed" : "packing_batch_reopened";
  return { ok: true, value: {
    packingPlan: updated,
    changed: true,
    auditEvent: audit({ id: `AUD-${packingPlan.id}-${batchId}-${eventType}-${crypto.randomUUID()}`, eventType, entityType: "PackingBatch", entityId: batchId, actorType: "human", actorId: "demo_user", occurredAt: recovery ? context.timeline.recoveryPackingChangedAt : context.timeline.primaryPackingChangedAt, previousState: { status: batch.status }, newState: { status: complete ? "complete" : "pending", packingPlanStatus: updated.status } }),
  } };
}

export function completeMissionStopTransition(mission: Mission, stopId: string, eventType: "pickup_complete" | "delivery_complete", context: AlmanacScenarioContext = scenarioContext): TransitionResult<{ mission: Mission; event: AuditEvent }> {
  const stop = mission.stops.find((candidate) => candidate.id === stopId);
  if (!stop) return fail("NOT_FOUND", `Mission stop ${stopId} was not found.`);
  if (mission.status !== "assigned" && mission.status !== "in_transit") return fail("INVALID_STATE_TRANSITION", `Mission ${mission.id} cannot complete stops while ${mission.status}.`);
  if (getNextCompletableMissionStopId(mission) !== stopId) return fail("INVALID_STATE_TRANSITION", "Mission stops must be completed in route order.");
  if ((eventType === "pickup_complete" && stop.quantityPickupLb <= 0) || (eventType === "delivery_complete" && stop.quantityDropoffLb <= 0)) return fail("VALIDATION_ERROR", "Completion type does not match the stop action.");
  const updated = setMissionStopComplete(mission, stopId);
  const recovery = mission.id === context.ids.recoveryMissionId;
  return { ok: true, value: { mission: updated, event: audit({ id: `AUD-${mission.id}-${stopId}`, eventType, entityType: "RouteStop", entityId: stopId, actorType: "human", actorId: "demo_user", occurredAt: recovery ? context.timeline.recoveryMissionEventAt : context.timeline.primaryMissionEventAt, previousState: { status: stop.status }, newState: { status: "complete", missionStatus: updated.status } }) } };
}

export function triggerPartnerCancellationTransition(originalPlan: PlanOption, originalMission: Mission, reason: string, context: AlmanacScenarioContext = scenarioContext): TransitionResult<{
  disruption: { id: string; missionId: string; type: "partner_canceled"; affectedEntityId: string; partnerId: string; affectedQuantityLb: number; status: "plan_generated"; details: { reason: string } };
  partner: { id: string; status: "canceled" };
  originalMission: Mission;
  replacementPlan: PlanOption;
  auditEvents: AuditEvent[];
}> {
  if (originalPlan.status !== "approved" || originalMission.id !== context.ids.primaryMissionId || originalMission.approvedPlanOptionId !== originalPlan.id || (originalMission.status !== "assigned" && originalMission.status !== "in_transit")) return fail("INVALID_STATE_TRANSITION", "Disruption requires the current approved plan and assigned mission.");
  const validation = validatePlanOption(originalPlan, context);
  if (!validation.approvable) return fail("PLAN_NOT_APPROVABLE", validation.errors.join(" "));
  const partnerId = context.ids.canceledPartnerId;
  const affectedQuantityLb = originalPlan.allocations.filter((item) => item.destinationId === partnerId).reduce((total, item) => total + item.quantityLb, 0);
  if (affectedQuantityLb <= 0) return fail("INVALID_STATE_TRANSITION", "The canceled partner has no assigned quantity to recover.");
  const affectedStop = originalMission.stops.find((stop) => stop.locationId === partnerId);
  if (!affectedStop || affectedStop.quantityDropoffLb !== affectedQuantityLb || affectedStop.status === "complete" || affectedStop.status === "canceled") return fail("INVALID_STATE_TRANSITION", "The affected stop is not eligible for cancellation.");
  const recovery = createRecoveryOptionResult(originalPlan, context);
  if (!recovery.option) return fail("VALIDATION_ERROR", recovery.issues.map((item) => item.message).join(" "));
  const replanningMission: Mission = { ...originalMission, status: "replanning", updatedAt: context.timeline.disruptionAt, stops: originalMission.stops.map((stop) => stop.locationId === partnerId ? { ...stop, status: "canceled" as const } : stop) };
  const disruption = { id: context.ids.disruptionId, missionId: originalMission.id, type: "partner_canceled" as const, affectedEntityId: partnerId, partnerId, affectedQuantityLb, status: "plan_generated" as const, details: { reason } };
  const auditEvents = [
    audit({ id: "AUD-103", eventType: "partner_canceled", entityType: "PartnerAgency", entityId: partnerId, actorType: "human", actorId: "demo_user", occurredAt: context.timeline.disruptionAt, previousState: { status: "available" }, newState: { status: "canceled", affectedQuantityLb }, reason }),
    audit({ id: "AUD-103A", eventType: "mission_disrupted", entityType: "Mission", entityId: originalMission.id, occurredAt: context.timeline.disruptionAt, previousState: { status: originalMission.status }, newState: { status: "disrupted", canceledStopPartnerId: partnerId } }),
    audit({ id: "AUD-103B", eventType: "mission_replanning", entityType: "Mission", entityId: originalMission.id, occurredAt: context.timeline.replanningAt, previousState: { status: "disrupted" }, newState: { status: "replanning", recoveryOptionId: recovery.option.id } }),
  ];
  return { ok: true, value: { disruption, partner: { id: partnerId, status: "canceled" }, originalMission: replanningMission, replacementPlan: recovery.option, auditEvents } };
}

export function approveRecoveryTransition(originalPlan: PlanOption, originalPackingPlan: PackingPlan, originalMission: Mission, disruption: { id: string; missionId: string; partnerId: string; affectedQuantityLb: number }, context: AlmanacScenarioContext = scenarioContext): TransitionResult<{
  approvedOption: PlanOption;
  originalMission: Mission;
  replacementMission: Mission;
  replacementPackingPlan: PackingPlan;
  auditEvents: AuditEvent[];
}> {
  if (disruption.id !== context.ids.disruptionId || originalPlan.status !== "approved" || originalMission.id !== disruption.missionId || originalMission.approvedPlanOptionId !== originalPlan.id || originalMission.status !== "replanning" || originalPackingPlan.id !== context.ids.primaryPackingPlanId || originalPackingPlan.approvedPlanOptionId !== originalPlan.id) return fail("INVALID_STATE_TRANSITION", "Recovery can only follow a recorded disruption in replanning state.");
  const canceledStop = originalMission.stops.find((stop) => stop.locationId === disruption.partnerId);
  if (!canceledStop || canceledStop.status !== "canceled" || canceledStop.quantityDropoffLb !== disruption.affectedQuantityLb) return fail("INVALID_STATE_TRANSITION", "Recovery requires the affected mission stop to be canceled.");
  const affected = originalPlan.allocations.filter((item) => item.destinationId === disruption.partnerId).reduce((total, item) => total + item.quantityLb, 0);
  if (affected !== disruption.affectedQuantityLb) return fail("VALIDATION_ERROR", "Disruption quantity does not match the approved plan.");
  const recovery = createRecoveryOptionResult(originalPlan, context);
  if (!recovery.option) return fail("VALIDATION_ERROR", recovery.issues.map((item) => item.message).join(" "));
  const validation = validatePlanOption(recovery.option, context);
  if (!validation.approvable) return fail("PLAN_NOT_APPROVABLE", validation.errors.join(" "));
  const approvedOption = { ...recovery.option, status: "approved" as const };
  const superseded = { ...originalMission, status: "superseded" as const, updatedAt: context.timeline.recoveryApprovedAt };
  const replacementMission = preserveCompletedMissionWork(originalMission, createMission(approvedOption, context.ids.recoveryMissionId, context));
  const replacementPackingPlan = createRecoveryPackingPlan(approvedOption, originalPackingPlan, context);
  const auditEvents = [
    audit({ id: "AUD-104", eventType: "recovery_approved", entityType: "PlanOption", entityId: approvedOption.id, actorType: "human", actorId: "demo_user", occurredAt: context.timeline.recoveryApprovedAt, previousState: { missionId: originalMission.id, status: "replanning", affectedQuantityLb: disruption.affectedQuantityLb }, newState: { missionId: replacementMission.id, status: "assigned", modeledReplanningSeconds: context.scenario.modeledReplanningSeconds }, reason: "Approved alternate-partner recovery plan." }),
    audit({ id: "AUD-104A", eventType: "mission_superseded", entityType: "Mission", entityId: originalMission.id, occurredAt: context.timeline.recoveryApprovedAt, previousState: { status: "replanning" }, newState: { status: "superseded", replacementMissionId: replacementMission.id } }),
    audit({ id: "AUD-104B", eventType: "replacement_mission_assigned", entityType: "Mission", entityId: replacementMission.id, occurredAt: context.timeline.recoveryApprovedAt, newState: { status: "assigned", supersedesMissionId: originalMission.id } }),
  ];
  return { ok: true, value: { approvedOption, originalMission: superseded, replacementMission, replacementPackingPlan, auditEvents } };
}
