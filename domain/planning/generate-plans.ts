import {
  modeledHouseholdEquivalents,
  plannedColdStorageUtilizationPct,
  refrigeratedStagingUtilizationPct,
} from "@/domain/metrics/calculate";
import {
  scenarioContext,
  type AlmanacScenarioContext,
} from "@/domain/planning/scenario-context";
import {
  acceptanceHistorySignal,
  calculateDestinationScore,
  type DestinationScoreInput,
} from "@/domain/scoring/destination-score";
import type { Allocation, DestinationScore, PlanOption, PlanSet } from "@/domain/types";

function partnerScore(
  context: AlmanacScenarioContext,
  partnerId: string,
  input: Omit<DestinationScoreInput, "historicalAcceptance" | "refusalRiskPenalty">,
): DestinationScore {
  const partner = context.partners.find((candidate) => candidate.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} was not found.`);
  const acceptance = acceptanceHistorySignal(partner, context.productLot.category);
  return calculateDestinationScore({
    ...input,
    historicalAcceptance: acceptance.score,
    refusalRiskPenalty: Math.round(partner.refusalRisk / 5),
  });
}

function destinationScores(
  context: AlmanacScenarioContext,
): Record<string, DestinationScore> {
  const [partnerOne] = context.partners;
  return {
    [context.warehouse.id]: calculateDestinationScore({
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
    [partnerOne.id]: partnerScore(context, partnerOne.id, {
      documentedNeed: 100,
      usabilityMatch: 100,
      receivingWindowFit: 100,
      availableCapacity: 100,
      recentServiceGap: 100,
      equityPriority: 100,
      travelPenalty: 2,
      spoilagePenalty: 1,
    }),
    [context.ids.canceledPartnerId]: partnerScore(context, context.ids.canceledPartnerId, {
      documentedNeed: 100,
      usabilityMatch: 100,
      receivingWindowFit: 100,
      availableCapacity: 100,
      recentServiceGap: 100,
      equityPriority: 100,
      travelPenalty: 4,
      spoilagePenalty: 2,
    }),
    [context.ids.mealKitPartnerId]: partnerScore(context, context.ids.mealKitPartnerId, {
      documentedNeed: 100,
      usabilityMatch: 100,
      receivingWindowFit: 100,
      availableCapacity: 100,
      recentServiceGap: 100,
      equityPriority: 100,
      travelPenalty: 4,
      spoilagePenalty: 3,
    }),
    [context.ids.alternatePartnerId]: partnerScore(context, context.ids.alternatePartnerId, {
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
}

function allocation(
  context: AlmanacScenarioContext,
  scores: Record<string, DestinationScore>,
  id: string,
  destinationId: string,
  destinationType: Allocation["destinationType"],
  quantityLb: number,
  arrivalAt: string,
  handling: Allocation["handling"],
): Allocation {
  return {
    id,
    productLotId: context.productLot.id,
    destinationId,
    destinationType,
    quantityLb,
    plannedArrivalAt: arrivalAt,
    handling,
    score: scores[destinationId] ?? scores[context.warehouse.id],
  };
}

function commonAssumptions(context: AlmanacScenarioContext) {
  return [
    `All quantities use the validated ${context.availableInventoryQuantityLb.toLocaleString()} lb available inventory at ${context.warehouse.id}.`,
    "Route miles use the seeded distance matrix; no live routing service is required.",
    "Staff condition review is recorded; the explicit inspection hold still requires supervisor release.",
    `Destination ranking uses ${context.scenario.scoreConfigVersion}.`,
    "Category-specific agency acceptance uses synthetic accepted, refused, and short-receipt history with visible sample sizes.",
    "Expected spoilage, staff effort, need-match, equity, and refusal-risk are seeded strategy-level estimates; allocation edits recalculate outbound quantity, household-equivalents, and capacity metrics only.",
  ];
}

function plannedOutboundAllocationLb(allocations: Allocation[]): number {
  return allocations
    .filter(
      (item) =>
        item.destinationType !== "warehouse" &&
        item.destinationType !== "external_redirect" &&
        item.handling !== "redirect",
    )
    .reduce((total, item) => total + item.quantityLb, 0);
}

function metricSeed(
  context: AlmanacScenarioContext,
  estimate: AlmanacScenarioContext["strategyEstimates"]["balancedRelease"],
  quantityPlannedOutboundInTimeLb: number,
) {
  return {
    quantityPlannedOutboundInTimeLb,
    expectedSpoilageLb: estimate.expectedSpoilageLb,
    modeledHouseholdEquivalents: modeledHouseholdEquivalents(
      quantityPlannedOutboundInTimeLb,
      context.scenario.householdWeightLb,
    ),
    totalMiles: estimate.totalMiles,
    staffMinutes: estimate.staffMinutes,
    coldCapacityUtilizationPct: 0,
    refrigeratedStagingUtilizationPct: 0,
    needMatchScore: estimate.needMatchScore,
    equityIndicator: estimate.equityIndicator,
    refusalRiskScore: estimate.refusalRiskScore,
  };
}

export function withDerivedCapacityMetrics(
  plan: PlanOption,
  context: AlmanacScenarioContext = scenarioContext,
): PlanOption {
  return {
    ...plan,
    metrics: {
      ...plan.metrics,
      coldCapacityUtilizationPct: plannedColdStorageUtilizationPct(plan, context.warehouse),
      refrigeratedStagingUtilizationPct: refrigeratedStagingUtilizationPct(
        plan,
        context.warehouse,
      ),
    },
  };
}

export function applyCanonicalAllocationEdit(
  canonical: PlanOption,
  submitted: PlanOption,
  context: AlmanacScenarioContext = scenarioContext,
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

  if (allocations.some((item) => item === null)) return null;
  const canonicalAllocations = allocations as Allocation[];
  const quantityPlannedOutboundInTimeLb = plannedOutboundAllocationLb(canonicalAllocations);

  return withDerivedCapacityMetrics(
    {
      ...canonical,
      allocations: canonicalAllocations,
      metrics: {
        ...canonical.metrics,
        quantityPlannedOutboundInTimeLb,
        modeledHouseholdEquivalents: modeledHouseholdEquivalents(
          quantityPlannedOutboundInTimeLb,
          context.scenario.householdWeightLb,
        ),
      },
    },
    context,
  );
}

export function generatePlanSet(
  context: AlmanacScenarioContext = scenarioContext,
): PlanSet {
  const scores = destinationScores(context);
  const quantities = context.planQuantities;
  const [partnerOne] = context.partners;
  const assumptions = commonAssumptions(context);
  const storageHeadroomLb =
    context.warehouse.refrigeratedCapacityLb - context.warehouse.occupiedRefrigeratedLb;
  const all = (
    id: string,
    destinationId: string,
    destinationType: Allocation["destinationType"],
    quantityLb: number,
    arrivalAt: string,
    handling: Allocation["handling"],
  ) => allocation(context, scores, id, destinationId, destinationType, quantityLb, arrivalAt, handling);

  const holdPlan = withDerivedCapacityMetrics(
    {
      id: "OPT-001",
      planSetId: context.ids.planSetId,
      name: "Hold for Later",
      strategy: "hold_for_later",
      status: "generated",
      allocations: [
        all(
          "ALL-001",
          context.warehouse.id,
          "warehouse",
          quantities.holdForLaterLb,
          context.timeline.warehouseArrivalAt,
          "store",
        ),
      ],
      inspectionHoldLb: 0,
      unallocatedLb: 0,
      metrics: metricSeed(context, context.strategyEstimates.holdForLater, 0),
      assumptions,
      risks: [
        {
          code: "CAPACITY_EXCEEDED",
          level: "critical",
          message: `Exceeds refrigerated capacity by ${quantities.holdForLaterLb - storageHeadroomLb} lb.`,
          blocking: true,
        },
      ],
      excludedDestinations: [],
    },
    context,
  );

  const fastestPlan = withDerivedCapacityMetrics(
    {
      id: "OPT-002",
      planSetId: context.ids.planSetId,
      name: "Fastest Agency Release",
      strategy: "fastest_release",
      status: "generated",
      allocations: [
        all(
          "ALL-002",
          partnerOne.id,
          "partner",
          quantities.fastestPartnerOneLb,
          context.timeline.partnerOneArrivalAt,
          "cross_dock",
        ),
        all(
          "ALL-003",
          context.ids.canceledPartnerId,
          "partner",
          quantities.fastestCanceledPartnerLb,
          context.timeline.canceledPartnerArrivalAt,
          "cross_dock",
        ),
        all(
          "ALL-004",
          context.ids.mealKitPartnerId,
          "packing_program",
          quantities.fastestMealKitLb,
          context.timeline.mealKitArrivalAt,
          "pack",
        ),
      ],
      inspectionHoldLb: 0,
      unallocatedLb: 0,
      metrics: metricSeed(
        context,
        context.strategyEstimates.fastestRelease,
        quantities.fastestPartnerOneLb +
          quantities.fastestCanceledPartnerLb +
          quantities.fastestMealKitLb,
      ),
      assumptions,
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
    },
    context,
  );

  const balancedOutboundLb =
    quantities.balancedPartnerOneLb +
    quantities.balancedCanceledPartnerLb +
    quantities.balancedMealKitLb;

  const balancedPlan = withDerivedCapacityMetrics(
    {
      id: context.ids.primaryOptionId,
      planSetId: context.ids.planSetId,
      name: "Balanced Release",
      strategy: "balanced_release",
      status: "selected",
      allocations: [
        all(
          "ALL-005",
          partnerOne.id,
          "partner",
          quantities.balancedPartnerOneLb,
          context.timeline.partnerOneArrivalAt,
          "cross_dock",
        ),
        all(
          "ALL-006",
          context.ids.canceledPartnerId,
          "partner",
          quantities.balancedCanceledPartnerLb,
          context.timeline.canceledPartnerArrivalAt,
          "cross_dock",
        ),
        all(
          "ALL-007",
          context.ids.mealKitPartnerId,
          "packing_program",
          quantities.balancedMealKitLb,
          context.timeline.mealKitArrivalAt,
          "pack",
        ),
      ],
      inspectionHoldLb: quantities.balancedInspectionHoldLb,
      unallocatedLb: 0,
      metrics: metricSeed(
        context,
        context.strategyEstimates.balancedRelease,
        balancedOutboundLb,
      ),
      assumptions,
      risks: [
        {
          code: "INSPECTION_REQUIRED",
          level: "medium",
          message: `Supervisor inspection is required for the ${quantities.balancedInspectionHoldLb} lb hold.`,
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
    },
    context,
  );

  return {
    id: context.ids.planSetId,
    inventoryLotId: context.productLot.id,
    options: [holdPlan, fastestPlan, balancedPlan],
    generatedAt: context.timeline.planGeneratedAt,
    selectedOptionId: context.ids.primaryOptionId,
  };
}

export function getDestinationName(
  destinationId: string,
  context: AlmanacScenarioContext = scenarioContext,
): string {
  if (destinationId === context.warehouse.id) return context.warehouse.name;
  return context.partners.find((partner) => partner.id === destinationId)?.name ?? destinationId;
}
