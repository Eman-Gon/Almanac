import { getDestinationName } from "@/domain/planning/generate-plans";
import { scenarioContext, type AlmanacScenarioContext } from "@/domain/planning/scenario-context";
import type { AuditEvent, Mission, PackingPlan, PlanOption } from "@/domain/types";

function stagingFor(plan: PlanOption, destinationId: string): string {
  const allocation = plan.allocations.find((item) => item.destinationId === destinationId);
  if (allocation?.destinationType === "packing_program") return "Refrigerated staging · Lane C";
  return "Cross-dock outbound · Lane B";
}

function receivingWindowFor(destinationId: string, context: AlmanacScenarioContext) {
  const partner = context.partners.find((candidate) => candidate.id === destinationId);
  const window = partner?.receivingWindows[0];
  if (!window) {
    throw new Error(`Receiving window for partner ${destinationId} was not found.`);
  }
  return window;
}

export function createPackingPlan(
  plan: PlanOption,
  packingPlanId = scenarioContext.ids.primaryPackingPlanId,
  context: AlmanacScenarioContext = scenarioContext,
): PackingPlan {
  const batchNumberOffset = packingPlanId === context.ids.recoveryPackingPlanId ? 100 : 0;
  const batches: PackingPlan["batches"] = plan.allocations.map((allocation, index) => ({
    id: `BAT-${String(batchNumberOffset + index + 1).padStart(3, "0")}`,
    destinationId: allocation.destinationId,
    productLotId: allocation.productLotId,
    quantityLb: allocation.quantityLb,
    priority: index + 1,
    stagingLocation: stagingFor(plan, allocation.destinationId),
    temperatureClass: context.productLot.temperatureClass,
    instruction:
      allocation.handling === "pack"
        ? `Place in refrigerated staging for ${getDestinationName(allocation.destinationId, context)} meal-kit line.`
        : `Cross-dock directly to the outbound lane for ${getDestinationName(allocation.destinationId, context)}.`,
    status: "pending",
  }));

  if (plan.inspectionHoldLb > 0) {
    batches.push({
      id: `BAT-${String(batchNumberOffset + batches.length + 1).padStart(3, "0")}`,
      destinationId: context.warehouse.id,
      productLotId: context.productLot.id,
      quantityLb: plan.inspectionHoldLb,
      priority: batches.length + 1,
      stagingLocation: "Refrigerated inspection bay · Hold 2",
      temperatureClass: context.productLot.temperatureClass,
      instruction: "Hold for supervisor inspection; do not release automatically.",
      status: "pending",
    });
  }

  return {
    id: packingPlanId,
    approvedPlanOptionId: plan.id,
    batches,
    status: "ready",
  };
}

export function startPackingPlan(packingPlan: PackingPlan): PackingPlan {
  if (packingPlan.status === "complete") return packingPlan;
  return { ...packingPlan, status: "in_progress" };
}

export function setPackingBatchCompletion(
  packingPlan: PackingPlan,
  batchId: string,
  complete: boolean,
): PackingPlan {
  if (!packingPlan.batches.some((batch) => batch.id === batchId)) {
    throw new Error(`Packing batch ${batchId} was not found.`);
  }
  const batches = packingPlan.batches.map((batch) =>
    batch.id === batchId
      ? { ...batch, status: complete ? ("complete" as const) : ("pending" as const) }
      : batch,
  );

  return {
    ...packingPlan,
    batches,
    status: batches.every((batch) => batch.status === "complete")
      ? "complete"
      : "in_progress",
  };
}

function scaleRouteLegs(
  legs: Mission["routeLegs"],
  targetMiles: number,
): Mission["routeLegs"] {
  const templateMiles = legs.reduce((total, leg) => total + leg.distanceMiles, 0);
  if (templateMiles === 0 || targetMiles === templateMiles) return legs;
  const scale = targetMiles / templateMiles;
  let assignedMiles = 0;

  return legs.map((leg, index) => {
    const distanceMiles = index === legs.length - 1
      ? Number((targetMiles - assignedMiles).toFixed(1))
      : Number((leg.distanceMiles * scale).toFixed(1));
    assignedMiles += distanceMiles;
    return {
      ...leg,
      distanceMiles,
      durationMinutes: Math.max(1, Math.round(leg.durationMinutes * scale)),
    };
  });
}

function locationPoint(locationId: string, context: AlmanacScenarioContext): [number, number] {
  const location = locationId === context.warehouse.id
    ? context.warehouse.location
    : context.partners.find((partner) => partner.id === locationId)?.location;
  return [location?.latitude ?? 0, location?.longitude ?? 0];
}

function routeLegs(
  stops: Mission["stops"],
  targetMiles: number,
  template: AlmanacScenarioContext["routes"]["primary"],
  context: AlmanacScenarioContext,
): Mission["routeLegs"] {
  return scaleRouteLegs(stops.slice(0, -1).map((stop, index) => ({
    fromStopId: stop.id,
    toStopId: stops[index + 1].id,
    distanceMiles: template[index]?.distanceMiles ?? 0,
    durationMinutes: template[index]?.durationMinutes ?? 1,
    polyline: [locationPoint(stop.locationId, context), locationPoint(stops[index + 1].locationId, context)],
  })), targetMiles);
}

export function createMission(
  plan: PlanOption,
  missionId = scenarioContext.ids.primaryMissionId,
  context: AlmanacScenarioContext = scenarioContext,
): Mission {
  const recovery = missionId === context.ids.recoveryMissionId;
  const warehouseAllocationLb = plan.allocations
    .filter((allocation) => allocation.destinationId === context.warehouse.id)
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  const deliveryAllocations = plan.allocations.filter(
    (allocation) => allocation.destinationId !== context.warehouse.id,
  );
  const outboundLoadLb = deliveryAllocations.reduce(
    (total, allocation) => total + allocation.quantityLb,
    0,
  );
  const stops: Mission["stops"] = [
    {
      id: recovery ? "STP-101" : "STP-001",
      sequence: 1,
      locationId: context.warehouse.id,
      locationType: "warehouse",
      arrivalWindow: context.warehouse.dockWindows[0],
      quantityPickupLb: outboundLoadLb,
      quantityDropoffLb: 0,
      status: "pending",
      instructions: warehouseAllocationLb > 0
        ? ["Retain the blocked quantity in assigned refrigerated storage; no mission may depart."]
        : [
            `Load ${outboundLoadLb} lb of staff-cleared refrigerated inventory.`,
            "Verify partner batches and inspection hold before departure.",
          ],
    },
    ...deliveryAllocations.map((allocation, index) => ({
      id: recovery
        ? `STP-${String(index + 102).padStart(3, "0")}`
        : `STP-${String(index + 2).padStart(3, "0")}`,
      sequence: index + 2,
      locationId: allocation.destinationId,
      locationType: "partner" as const,
      arrivalWindow: receivingWindowFor(allocation.destinationId, context),
      quantityPickupLb: 0,
      quantityDropoffLb: allocation.quantityLb,
      status: "pending" as const,
      instructions: [
        `Confirm receiving staff before unloading ${allocation.quantityLb} lb.`,
      ],
    })),
  ];

  return {
    id: missionId,
    inventoryLotId: context.productLot.id,
    approvedPlanOptionId: plan.id,
    vehicleId: context.vehicle.id,
    driverId: context.driver.id,
    stops,
    routeLegs: recovery
      ? routeLegs(stops, plan.metrics.totalMiles, context.routes.recovery, context)
      : plan.strategy === "hold_for_later"
        ? []
        : routeLegs(stops, plan.metrics.totalMiles, context.routes.primary, context),
    status: "assigned",
    createdAt: recovery
      ? context.timeline.recoveryApprovedAt
      : context.timeline.planApprovedAt,
    updatedAt: recovery
      ? context.timeline.recoveryApprovedAt
      : context.timeline.planApprovedAt,
  };
}

export function setMissionStopComplete(mission: Mission, stopId: string): Mission {
  if (mission.status !== "assigned" && mission.status !== "in_transit") {
    return mission;
  }
  const stop = mission.stops.find((candidate) => candidate.id === stopId);
  if (!stop) throw new Error(`Mission stop ${stopId} was not found.`);
  if (stop.status === "canceled") return mission;
  if (getNextCompletableMissionStopId(mission) !== stopId) return mission;

  const stops = mission.stops.map((candidate) =>
    candidate.id === stopId
      ? { ...candidate, status: "complete" as const }
      : candidate,
  );
  const delivered = stops
    .filter((candidate) => candidate.status !== "canceled")
    .every((candidate) => candidate.status === "complete");

  return {
    ...mission,
    stops,
    status: delivered ? "delivered" : mission.status,
  };
}

export function getNextCompletableMissionStopId(mission: Mission): string | null {
  if (mission.status !== "assigned" && mission.status !== "in_transit") {
    return null;
  }
  return mission.stops.find((stop) => stop.status === "pending")?.id ?? null;
}

export function createApprovalAuditEvent(
  plan: PlanOption,
  reason?: string,
  context: AlmanacScenarioContext = scenarioContext,
): AuditEvent {
  return {
    id: "AUD-102",
    eventType: "plan_approved",
    entityType: "PlanOption",
    entityId: plan.id,
    actorType: "human",
    actorId: "demo_user",
    occurredAt: context.timeline.planApprovedAt,
    previousState: { status: plan.status },
    newState: { status: "approved", missionId: context.ids.primaryMissionId, packingPlanId: context.ids.primaryPackingPlanId },
    reason: reason || "Best balance of urgency, capacity, and documented need.",
  };
}
