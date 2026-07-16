import { donation, partners, productLot, scenario, warehouse } from "@/data/seed/scenario";
import { estimatedHouseholdsSupported } from "@/domain/metrics/calculate";
import { calculateDestinationScore } from "@/domain/scoring/destination-score";
import type { Allocation, DestinationScore, PlanOption, PlanSet } from "@/domain/types";

const planSetId = "PLN-104";

const destinationScores: Record<string, DestinationScore> = {
  "WH-001": calculateDestinationScore({
    documentedNeed: 40,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 35,
    recentServiceGap: 20,
    equityPriority: 30,
    travelPenalty: 2,
    spoilagePenalty: 8,
    refusalRiskPenalty: 0,
  }),
  "PAR-001": calculateDestinationScore({
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 100,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 2,
    spoilagePenalty: 1,
    refusalRiskPenalty: 1,
  }),
  "PAR-002": calculateDestinationScore({
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 100,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 4,
    spoilagePenalty: 2,
    refusalRiskPenalty: 2,
  }),
  "PAR-003": calculateDestinationScore({
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 100,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 4,
    spoilagePenalty: 3,
    refusalRiskPenalty: 3,
  }),
  "PAR-004": calculateDestinationScore({
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 95,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 5,
    spoilagePenalty: 2,
    refusalRiskPenalty: 2,
  }),
};

function allocation(
  id: string,
  destinationId: string,
  destinationType: Allocation["destinationType"],
  quantityLb: number,
  arrivalAt: string,
  handling: Allocation["handling"],
): Allocation {
  return {
    id,
    productLotId: productLot.id,
    destinationId,
    destinationType,
    quantityLb,
    plannedArrivalAt: arrivalAt,
    handling,
    score: destinationScores[destinationId] ?? destinationScores["WH-001"],
  };
}

function commonAssumptions() {
  return [
    "All quantities use the confirmed 1,200 lb operational estimate.",
    "Route miles use the seeded distance matrix; no live routing service is required.",
    "Food condition remains subject to staff inspection.",
    `Destination ranking uses ${scenario.scoreConfigVersion}.`,
  ];
}

function createWarehousePlan(): PlanOption {
  return {
    id: "OPT-001",
    planSetId,
    name: "Warehouse First",
    strategy: "warehouse_first",
    status: "generated",
    allocations: [
      allocation(
        "ALL-001",
        warehouse.id,
        "warehouse",
        1_200,
        "2026-07-15T11:35:00-07:00",
        "store",
      ),
    ],
    inspectionHoldLb: 0,
    declinedLb: 0,
    metrics: {
      quantityDistributedInTimeLb: 1_200,
      expectedSpoilageLb: 210,
      estimatedHouseholdsSupported: estimatedHouseholdsSupported(1_200, 3),
      totalMiles: 18.4,
      staffMinutes: 110,
      coldCapacityUtilizationPct: 126,
      needMatchScore: 72,
      equityIndicator: 54,
      refusalRiskScore: 6,
    },
    assumptions: commonAssumptions(),
    risks: [
      {
        code: "CAPACITY_EXCEEDED",
        level: "critical",
        message: "Exceeds refrigerated capacity by 780 lb.",
        blocking: true,
      },
    ],
    excludedDestinations: [],
  };
}

function createDirectPlan(): PlanOption {
  return {
    id: "OPT-002",
    planSetId,
    name: "Direct Distribution",
    strategy: "direct_distribution",
    status: "generated",
    allocations: [
      allocation("ALL-002", "PAR-001", "partner", 420, "2026-07-15T11:30:00-07:00", "cross_dock"),
      allocation("ALL-003", "PAR-002", "partner", 380, "2026-07-15T12:05:00-07:00", "cross_dock"),
      allocation("ALL-004", "PAR-003", "packing_program", 400, "2026-07-15T12:40:00-07:00", "pack"),
    ],
    inspectionHoldLb: 0,
    declinedLb: 0,
    metrics: {
      quantityDistributedInTimeLb: 1_200,
      expectedSpoilageLb: 90,
      estimatedHouseholdsSupported: estimatedHouseholdsSupported(1_200, 3),
      totalMiles: 45.7,
      staffMinutes: 108,
      coldCapacityUtilizationPct: 92,
      needMatchScore: 84,
      equityIndicator: 83,
      refusalRiskScore: 11,
    },
    assumptions: commonAssumptions(),
    risks: [
      {
        code: "WINDOW_SENSITIVITY",
        level: "medium",
        message: "Three same-day receiving windows leave limited recovery time.",
        blocking: false,
      },
    ],
    excludedDestinations: [
      { destinationId: "PAR-010", reason: "Destination is unavailable today." },
    ],
  };
}

function createMixedPlan(): PlanOption {
  return {
    id: "OPT-003",
    planSetId,
    name: "Mixed Plan",
    strategy: "mixed",
    status: "selected",
    allocations: [
      allocation("ALL-005", "PAR-001", "partner", 420, "2026-07-15T11:30:00-07:00", "cross_dock"),
      allocation("ALL-006", "PAR-002", "partner", 320, "2026-07-15T12:05:00-07:00", "cross_dock"),
      allocation("ALL-007", "PAR-003", "packing_program", 400, "2026-07-15T12:40:00-07:00", "pack"),
    ],
    inspectionHoldLb: 60,
    declinedLb: 0,
    metrics: {
      quantityDistributedInTimeLb: 1_140,
      expectedSpoilageLb: 60,
      estimatedHouseholdsSupported: estimatedHouseholdsSupported(1_140, 3),
      totalMiles: 24.8,
      staffMinutes: 96,
      coldCapacityUtilizationPct: 79,
      needMatchScore: 91,
      equityIndicator: 87,
      refusalRiskScore: 8,
    },
    assumptions: commonAssumptions(),
    risks: [
      {
        code: "INSPECTION_REQUIRED",
        level: "medium",
        message: "Supervisor inspection is required for the 60 lb hold.",
        blocking: false,
      },
    ],
    excludedDestinations: [
      {
        destinationId: "PAR-005",
        reason: "Only 160 lb compatible cold capacity is available.",
      },
      { destinationId: "PAR-010", reason: "Destination is unavailable today." },
    ],
  };
}

export function generatePlanSet(): PlanSet {
  const set: PlanSet = {
    id: planSetId,
    donationId: donation.id,
    options: [createWarehousePlan(), createDirectPlan(), createMixedPlan()],
    generatedAt: "2026-07-15T10:47:00-07:00",
    selectedOptionId: "OPT-003",
  };

  return set;
}

export function getDestinationName(destinationId: string): string {
  if (destinationId === warehouse.id) return warehouse.name;
  return partners.find((partner) => partner.id === destinationId)?.name ?? destinationId;
}
