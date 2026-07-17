import { partners, productLot, scenario, warehouse } from "@/data/seed/scenario";
import {
  modeledHouseholdEquivalents,
  plannedColdStorageUtilizationPct,
  refrigeratedStagingUtilizationPct,
} from "@/domain/metrics/calculate";
import {
  acceptanceHistorySignal,
  calculateDestinationScore,
  type DestinationScoreInput,
} from "@/domain/scoring/destination-score";
import type { Allocation, DestinationScore, PlanOption, PlanSet } from "@/domain/types";

const planSetId = "PLN-104";

function partnerScore(
  partnerId: string,
  input: Omit<DestinationScoreInput, "historicalAcceptance" | "refusalRiskPenalty">,
): DestinationScore {
  const partner = partners.find((candidate) => candidate.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} was not found.`);
  const acceptance = acceptanceHistorySignal(partner, productLot.category);
  return calculateDestinationScore({
    ...input,
    historicalAcceptance: acceptance.score,
    refusalRiskPenalty: Math.round(partner.refusalRisk / 5),
  });
}

const destinationScores: Record<string, DestinationScore> = {
  "WH-001": calculateDestinationScore({
    documentedNeed: 40,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 35,
    recentServiceGap: 20,
    equityPriority: 30,
    historicalAcceptance: 0,
    travelPenalty: 2,
    spoilagePenalty: 8,
    refusalRiskPenalty: 0,
  }),
  "PAR-001": partnerScore("PAR-001", {
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 100,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 2,
    spoilagePenalty: 1,
  }),
  "PAR-002": partnerScore("PAR-002", {
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 100,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 4,
    spoilagePenalty: 2,
  }),
  "PAR-003": partnerScore("PAR-003", {
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 100,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 4,
    spoilagePenalty: 3,
  }),
  "PAR-004": partnerScore("PAR-004", {
    documentedNeed: 100,
    usabilityMatch: 100,
    receivingWindowFit: 100,
    availableCapacity: 95,
    recentServiceGap: 100,
    equityPriority: 100,
    travelPenalty: 5,
    spoilagePenalty: 2,
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
    "All quantities use the validated 1,200 lb available inventory at WH-001.",
    "Route miles use the seeded distance matrix; no live routing service is required.",
    "Staff condition review is recorded; the explicit inspection hold still requires supervisor release.",
    `Destination ranking uses ${scenario.scoreConfigVersion}.`,
    "Category-specific agency acceptance uses synthetic accepted, refused, and short-receipt history with visible sample sizes.",
    "Expected spoilage, staff effort, need-match, equity, and refusal-risk are seeded strategy-level estimates; allocation edits recalculate outbound quantity, household-equivalents, and capacity metrics only.",
  ];
}

function plannedOutboundAllocationLb(allocations: Allocation[]): number {
  return allocations
    .filter(
      (allocation) =>
        allocation.destinationType !== "warehouse" &&
        allocation.destinationType !== "external_redirect" &&
        allocation.handling !== "redirect",
    )
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
}

export function withDerivedCapacityMetrics(plan: PlanOption): PlanOption {
  return {
    ...plan,
    metrics: {
      ...plan.metrics,
      coldCapacityUtilizationPct: plannedColdStorageUtilizationPct(plan, warehouse),
      refrigeratedStagingUtilizationPct: refrigeratedStagingUtilizationPct(
        plan,
        warehouse,
      ),
    },
  };
}

export function applyCanonicalAllocationEdit(
  canonical: PlanOption,
  submitted: PlanOption,
): PlanOption | null {
  if (
    canonical.id !== submitted.id ||
    canonical.planSetId !== submitted.planSetId ||
    canonical.strategy !== submitted.strategy ||
    canonical.inspectionHoldLb !== submitted.inspectionHoldLb ||
    canonical.unallocatedLb !== submitted.unallocatedLb ||
    canonical.allocations.length !== submitted.allocations.length
  ) {
    return null;
  }

  const allocations = canonical.allocations.map((canonicalAllocation) => {
    const submittedAllocation = submitted.allocations.find(
      (candidate) => candidate.id === canonicalAllocation.id,
    );
    if (
      !submittedAllocation ||
      submittedAllocation.productLotId !== canonicalAllocation.productLotId ||
      submittedAllocation.destinationId !== canonicalAllocation.destinationId ||
      submittedAllocation.destinationType !== canonicalAllocation.destinationType ||
      submittedAllocation.plannedArrivalAt !== canonicalAllocation.plannedArrivalAt ||
      submittedAllocation.handling !== canonicalAllocation.handling
    ) {
      return null;
    }
    return {
      ...canonicalAllocation,
      quantityLb: submittedAllocation.quantityLb,
    };
  });

  if (allocations.some((allocation) => allocation === null)) return null;
  const canonicalAllocations = allocations as Allocation[];
  const quantityPlannedOutboundInTimeLb = plannedOutboundAllocationLb(
    canonicalAllocations,
  );

  return withDerivedCapacityMetrics({
    ...canonical,
    allocations: canonicalAllocations,
    metrics: {
      ...canonical.metrics,
      quantityPlannedOutboundInTimeLb,
      modeledHouseholdEquivalents: modeledHouseholdEquivalents(
        quantityPlannedOutboundInTimeLb,
        scenario.householdWeightLb,
      ),
    },
  });
}

function createHoldPlan(): PlanOption {
  const storageHeadroomLb =
    warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb;
  const storedQuantityLb = 1_200;

  return withDerivedCapacityMetrics({
    id: "OPT-001",
    planSetId,
    name: "Hold for Later",
    strategy: "hold_for_later",
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
    unallocatedLb: 0,
    metrics: {
      quantityPlannedOutboundInTimeLb: 0,
      expectedSpoilageLb: 210,
      modeledHouseholdEquivalents: 0,
      totalMiles: 0,
      staffMinutes: 110,
      coldCapacityUtilizationPct: 0,
      refrigeratedStagingUtilizationPct: 0,
      needMatchScore: 72,
      equityIndicator: 54,
      refusalRiskScore: 6,
    },
    assumptions: commonAssumptions(),
    risks: [
      {
        code: "CAPACITY_EXCEEDED",
        level: "critical",
        message: `Exceeds refrigerated capacity by ${storedQuantityLb - storageHeadroomLb} lb.`,
        blocking: true,
      },
    ],
    excludedDestinations: [],
  });
}

function createFastestReleasePlan(): PlanOption {
  return withDerivedCapacityMetrics({
    id: "OPT-002",
    planSetId,
    name: "Fastest Agency Release",
    strategy: "fastest_release",
    status: "generated",
    allocations: [
      allocation("ALL-002", "PAR-001", "partner", 420, "2026-07-15T11:30:00-07:00", "cross_dock"),
      allocation("ALL-003", "PAR-002", "partner", 380, "2026-07-15T12:05:00-07:00", "cross_dock"),
      allocation("ALL-004", "PAR-003", "packing_program", 400, "2026-07-15T12:40:00-07:00", "pack"),
    ],
    inspectionHoldLb: 0,
    unallocatedLb: 0,
    metrics: {
      quantityPlannedOutboundInTimeLb: 1_200,
      expectedSpoilageLb: 90,
      modeledHouseholdEquivalents: modeledHouseholdEquivalents(1_200, 3),
      totalMiles: 45.7,
      staffMinutes: 108,
      coldCapacityUtilizationPct: 0,
      refrigeratedStagingUtilizationPct: 0,
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
  });
}

function createBalancedReleasePlan(): PlanOption {
  return withDerivedCapacityMetrics({
    id: "OPT-003",
    planSetId,
    name: "Balanced Release",
    strategy: "balanced_release",
    status: "selected",
    allocations: [
      allocation("ALL-005", "PAR-001", "partner", 420, "2026-07-15T11:30:00-07:00", "cross_dock"),
      allocation("ALL-006", "PAR-002", "partner", 320, "2026-07-15T12:05:00-07:00", "cross_dock"),
      allocation("ALL-007", "PAR-003", "packing_program", 400, "2026-07-15T12:40:00-07:00", "pack"),
    ],
    inspectionHoldLb: 60,
    unallocatedLb: 0,
    metrics: {
      quantityPlannedOutboundInTimeLb: 1_140,
      expectedSpoilageLb: 60,
      modeledHouseholdEquivalents: modeledHouseholdEquivalents(1_140, 3),
      totalMiles: 24.8,
      staffMinutes: 96,
      coldCapacityUtilizationPct: 0,
      refrigeratedStagingUtilizationPct: 0,
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
  });
}

export function generatePlanSet(): PlanSet {
  const set: PlanSet = {
    id: planSetId,
    inventoryLotId: productLot.id,
    options: [
      createHoldPlan(),
      createFastestReleasePlan(),
      createBalancedReleasePlan(),
    ],
    generatedAt: "2026-07-15T10:47:00-07:00",
    selectedOptionId: "OPT-003",
  };

  return set;
}

export function getDestinationName(destinationId: string): string {
  if (destinationId === warehouse.id) return warehouse.name;
  return partners.find((partner) => partner.id === destinationId)?.name ?? destinationId;
}
