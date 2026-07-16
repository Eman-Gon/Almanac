import { donation, donor, drivers, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import { getDestinationName } from "@/domain/planning/generate-plans";
import type { AuditEvent, Mission, PackingPlan, PlanOption } from "@/domain/types";

function stagingFor(plan: PlanOption, destinationId: string): string {
  const allocation = plan.allocations.find((item) => item.destinationId === destinationId);
  if (allocation?.destinationType === "packing_program") return "Refrigerated staging · Lane C";
  return "Cross-dock outbound · Lane B";
}

export function createPackingPlan(plan: PlanOption): PackingPlan {
  const batches: PackingPlan["batches"] = plan.allocations.map((allocation, index) => ({
    id: `BAT-${String(index + 1).padStart(3, "0")}`,
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
  }));

  if (plan.inspectionHoldLb > 0) {
    batches.push({
      id: `BAT-${String(batches.length + 1).padStart(3, "0")}`,
      destinationId: warehouse.id,
      productLotId: productLot.id,
      quantityLb: plan.inspectionHoldLb,
      priority: batches.length + 1,
      stagingLocation: "Refrigerated inspection bay · Hold 2",
      temperatureClass: "refrigerated",
      instruction: "Hold for supervisor inspection; do not release automatically.",
    });
  }

  return {
    id: "PKG-104",
    approvedPlanOptionId: plan.id,
    batches,
    status: "ready",
  };
}

function initialRouteLegs(): Mission["routeLegs"] {
  return [
    {
      fromStopId: "STP-001",
      toStopId: "STP-002",
      distanceMiles: 6.4,
      durationMinutes: 16,
      polyline: [
        [donor.location.latitude, donor.location.longitude],
        [warehouse.location.latitude, warehouse.location.longitude],
      ],
    },
    {
      fromStopId: "STP-002",
      toStopId: "STP-003",
      distanceMiles: 7.8,
      durationMinutes: 18,
      polyline: [
        [warehouse.location.latitude, warehouse.location.longitude],
        [37.4323, -121.8996],
      ],
    },
    {
      fromStopId: "STP-003",
      toStopId: "STP-004",
      distanceMiles: 5.2,
      durationMinutes: 14,
      polyline: [
        [37.4323, -121.8996],
        [37.3551, -121.8241],
      ],
    },
    {
      fromStopId: "STP-004",
      toStopId: "STP-005",
      distanceMiles: 5.4,
      durationMinutes: 15,
      polyline: [
        [37.3551, -121.8241],
        [37.3189, -121.8861],
      ],
    },
  ];
}

function recoveryRouteLegs(): Mission["routeLegs"] {
  return [
    {
      fromStopId: "STP-101",
      toStopId: "STP-102",
      distanceMiles: 6.4,
      durationMinutes: 16,
      polyline: [
        [donor.location.latitude, donor.location.longitude],
        [warehouse.location.latitude, warehouse.location.longitude],
      ],
    },
    {
      fromStopId: "STP-102",
      toStopId: "STP-103",
      distanceMiles: 7.8,
      durationMinutes: 18,
      polyline: [
        [warehouse.location.latitude, warehouse.location.longitude],
        [37.4323, -121.8996],
      ],
    },
    {
      fromStopId: "STP-103",
      toStopId: "STP-104",
      distanceMiles: 8.1,
      durationMinutes: 21,
      polyline: [
        [37.4323, -121.8996],
        [37.3895, -121.9632],
      ],
    },
    {
      fromStopId: "STP-104",
      toStopId: "STP-105",
      distanceMiles: 6.3,
      durationMinutes: 17,
      polyline: [
        [37.3895, -121.9632],
        [37.3189, -121.8861],
      ],
    },
  ];
}

export function createMission(
  plan: PlanOption,
  missionId: "MSN-104" | "MSN-105" = "MSN-104",
): Mission {
  const recovery = missionId === "MSN-105";
  const stops: Mission["stops"] = [
    {
      id: recovery ? "STP-101" : "STP-001",
      sequence: 1,
      locationId: donor.id,
      locationType: "donor",
      arrivalWindow: donation.pickupWindow ?? {
        start: "2026-07-15T11:00:00-07:00",
        end: "2026-07-15T13:00:00-07:00",
      },
      quantityPickupLb: donation.quantityLb,
      quantityDropoffLb: 0,
      status: "pending",
      instructions: ["Confirm refrigerated handling", "Record staff condition check"],
    },
    {
      id: recovery ? "STP-102" : "STP-002",
      sequence: 2,
      locationId: warehouse.id,
      locationType: "warehouse",
      arrivalWindow: warehouse.dockWindows[0],
      quantityPickupLb: 0,
      quantityDropoffLb: plan.inspectionHoldLb,
      status: "pending",
      instructions: ["Cross-dock partner batches", "Move inspection hold to Hold 2"],
    },
    ...plan.allocations.map((allocation, index) => ({
      id: recovery
        ? `STP-${String(index + 103).padStart(3, "0")}`
        : `STP-${String(index + 3).padStart(3, "0")}`,
      sequence: index + 3,
      locationId: allocation.destinationId,
      locationType: "partner" as const,
      arrivalWindow: {
        start: "2026-07-15T09:30:00-07:00",
        end: allocation.plannedArrivalAt,
      },
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
    donationId: donation.id,
    approvedPlanOptionId: plan.id,
    vehicleId: vehicles[0].id,
    driverId: drivers[0].id,
    stops,
    routeLegs: recovery ? recoveryRouteLegs() : initialRouteLegs(),
    status: "assigned",
    createdAt: recovery
      ? "2026-07-15T11:18:11-07:00"
      : "2026-07-15T10:50:00-07:00",
    updatedAt: recovery
      ? "2026-07-15T11:18:11-07:00"
      : "2026-07-15T10:50:00-07:00",
  };
}

export function createApprovalAuditEvent(reason?: string): AuditEvent {
  return {
    id: "AUD-102",
    eventType: "plan_approved",
    entityType: "PlanOption",
    entityId: "OPT-003",
    actorType: "human",
    actorId: "demo_user",
    occurredAt: "2026-07-15T10:50:00-07:00",
    previousState: { status: "selected" },
    newState: { status: "approved", missionId: "MSN-104", packingPlanId: "PKG-104" },
    reason: reason || "Best balance of urgency, capacity, and documented need.",
  };
}
