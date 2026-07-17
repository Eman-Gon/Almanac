import { drivers, partners, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import { getDestinationName } from "@/domain/planning/generate-plans";
import type { AuditEvent, Mission, PackingPlan, PlanOption } from "@/domain/types";

function stagingFor(plan: PlanOption, destinationId: string): string {
  const allocation = plan.allocations.find((item) => item.destinationId === destinationId);
  if (allocation?.destinationType === "packing_program") return "Refrigerated staging · Lane C";
  return "Cross-dock outbound · Lane B";
}

function receivingWindowFor(destinationId: string) {
  const partner = partners.find((candidate) => candidate.id === destinationId);
  const window = partner?.receivingWindows[0];
  if (!window) {
    throw new Error(`Receiving window for partner ${destinationId} was not found.`);
  }
  return window;
}

export function createPackingPlan(
  plan: PlanOption,
  packingPlanId: "PKG-104" | "PKG-105" = "PKG-104",
): PackingPlan {
  const batchNumberOffset = packingPlanId === "PKG-105" ? 100 : 0;
  const batches: PackingPlan["batches"] = plan.allocations.map((allocation, index) => ({
    id: `BAT-${String(batchNumberOffset + index + 1).padStart(3, "0")}`,
    destinationId: allocation.destinationId,
    productLotId: allocation.productLotId,
    quantityLb: allocation.quantityLb,
    priority: index + 1,
    stagingLocation: stagingFor(plan, allocation.destinationId),
    temperatureClass: "refrigerated",
    instruction:
      allocation.handling === "pack"
        ? `Place in refrigerated staging for ${getDestinationName(allocation.destinationId)} meal-kit line.`
        : `Cross-dock directly to the outbound lane for ${getDestinationName(allocation.destinationId)}.`,
    status: "pending",
  }));

  if (plan.inspectionHoldLb > 0) {
    batches.push({
      id: `BAT-${String(batchNumberOffset + batches.length + 1).padStart(3, "0")}`,
      destinationId: warehouse.id,
      productLotId: productLot.id,
      quantityLb: plan.inspectionHoldLb,
      priority: batches.length + 1,
      stagingLocation: "Refrigerated inspection bay · Hold 2",
      temperatureClass: "refrigerated",
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

function initialRouteLegs(targetMiles: number): Mission["routeLegs"] {
  return scaleRouteLegs([
    {
      fromStopId: "STP-001",
      toStopId: "STP-002",
      distanceMiles: 7.8,
      durationMinutes: 18,
      polyline: [
        [warehouse.location.latitude, warehouse.location.longitude],
        [37.4323, -121.8996],
      ],
    },
    {
      fromStopId: "STP-002",
      toStopId: "STP-003",
      distanceMiles: 5.2,
      durationMinutes: 14,
      polyline: [
        [37.4323, -121.8996],
        [37.3551, -121.8241],
      ],
    },
    {
      fromStopId: "STP-003",
      toStopId: "STP-004",
      distanceMiles: 5.4,
      durationMinutes: 15,
      polyline: [
        [37.3551, -121.8241],
        [37.3189, -121.8861],
      ],
    },
  ], targetMiles);
}

function recoveryRouteLegs(targetMiles: number): Mission["routeLegs"] {
  return scaleRouteLegs([
    {
      fromStopId: "STP-101",
      toStopId: "STP-102",
      distanceMiles: 7.8,
      durationMinutes: 18,
      polyline: [
        [warehouse.location.latitude, warehouse.location.longitude],
        [37.4323, -121.8996],
      ],
    },
    {
      fromStopId: "STP-102",
      toStopId: "STP-103",
      distanceMiles: 8.1,
      durationMinutes: 21,
      polyline: [
        [37.4323, -121.8996],
        [37.3895, -121.9632],
      ],
    },
    {
      fromStopId: "STP-103",
      toStopId: "STP-104",
      distanceMiles: 6.3,
      durationMinutes: 17,
      polyline: [
        [37.3895, -121.9632],
        [37.3189, -121.8861],
      ],
    },
  ], targetMiles);
}

export function createMission(
  plan: PlanOption,
  missionId: "MSN-104" | "MSN-105" = "MSN-104",
): Mission {
  const recovery = missionId === "MSN-105";
  const warehouseAllocationLb = plan.allocations
    .filter((allocation) => allocation.destinationId === warehouse.id)
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  const deliveryAllocations = plan.allocations.filter(
    (allocation) => allocation.destinationId !== warehouse.id,
  );
  const outboundLoadLb = deliveryAllocations.reduce(
    (total, allocation) => total + allocation.quantityLb,
    0,
  );
  const stops: Mission["stops"] = [
    {
      id: recovery ? "STP-101" : "STP-001",
      sequence: 1,
      locationId: warehouse.id,
      locationType: "warehouse",
      arrivalWindow: warehouse.dockWindows[0],
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
      arrivalWindow: receivingWindowFor(allocation.destinationId),
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
    inventoryLotId: productLot.id,
    approvedPlanOptionId: plan.id,
    vehicleId: vehicles[0].id,
    driverId: drivers[0].id,
    stops,
    routeLegs: recovery
      ? recoveryRouteLegs(plan.metrics.totalMiles)
      : plan.strategy === "hold_for_later"
        ? []
        : initialRouteLegs(plan.metrics.totalMiles),
    status: "assigned",
    createdAt: recovery
      ? "2026-07-15T11:18:11-07:00"
      : "2026-07-15T10:50:00-07:00",
    updatedAt: recovery
      ? "2026-07-15T11:18:11-07:00"
      : "2026-07-15T10:50:00-07:00",
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
): AuditEvent {
  return {
    id: "AUD-102",
    eventType: "plan_approved",
    entityType: "PlanOption",
    entityId: plan.id,
    actorType: "human",
    actorId: "demo_user",
    occurredAt: "2026-07-15T10:50:00-07:00",
    previousState: { status: plan.status },
    newState: { status: "approved", missionId: "MSN-104", packingPlanId: "PKG-104" },
    reason: reason || "Best balance of urgency, capacity, and documented need.",
  };
}
