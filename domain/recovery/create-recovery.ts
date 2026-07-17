import { createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { modeledHouseholdEquivalents } from "@/domain/metrics/calculate";
import { withDerivedCapacityMetrics } from "@/domain/planning/generate-plans";
import {
  scenarioContext,
  type AlmanacScenarioContext,
} from "@/domain/planning/scenario-context";
import {
  acceptanceHistorySignal,
  calculateDestinationScore,
} from "@/domain/scoring/destination-score";
import type { Allocation, Mission, PackingPlan, PlanOption } from "@/domain/types";

export type RecoveryValidationIssue = {
  code: "MISSING_RECOVERY_ALLOCATION" | "MISSING_RECOVERY_PARTNER";
  entityId: string;
  message: string;
  blocking: true;
  source: "scenario_context";
};

export type RecoveryOptionResult = {
  option: PlanOption | null;
  issues: RecoveryValidationIssue[];
};

function issue(
  code: RecoveryValidationIssue["code"],
  entityId: string,
  message: string,
): RecoveryValidationIssue {
  return { code, entityId, message, blocking: true, source: "scenario_context" };
}

export function createRecoveryOptionResult(
  original: PlanOption,
  context: AlmanacScenarioContext = scenarioContext,
): RecoveryOptionResult {
  const { canceledPartnerId, mealKitPartnerId, alternatePartnerId } = context.ids;
  const affectedQuantityLb = original.allocations
    .filter((item) => item.destinationId === canceledPartnerId)
    .reduce((total, item) => total + item.quantityLb, 0);
  const unaffected = original.allocations.filter(
    (item) => item.destinationId !== canceledPartnerId,
  );
  const mealKit = unaffected.find((item) => item.destinationId === mealKitPartnerId);
  const mealKitPartner = context.partners.find((partner) => partner.id === mealKitPartnerId);
  const alternatePartner = context.partners.find(
    (partner) => partner.id === alternatePartnerId,
  );
  const issues: RecoveryValidationIssue[] = [];
  if (!mealKit) {
    issues.push(
      issue(
        "MISSING_RECOVERY_ALLOCATION",
        mealKitPartnerId,
        "Recovery requires a meal-kit allocation in the approved plan.",
      ),
    );
  }
  if (!mealKitPartner) {
    issues.push(
      issue(
        "MISSING_RECOVERY_PARTNER",
        mealKitPartnerId,
        "The configured meal-kit recovery partner is missing.",
      ),
    );
  }
  if (!alternatePartner) {
    issues.push(
      issue(
        "MISSING_RECOVERY_PARTNER",
        alternatePartnerId,
        "The configured alternate recovery partner is missing.",
      ),
    );
  }
  if (issues.length > 0 || !mealKit || !mealKitPartner || !alternatePartner) {
    return { option: null, issues };
  }

  const produceDemand = (partner: typeof mealKitPartner) =>
    partner.demandSignals
      .filter((signal) => signal.category === context.productLot.category)
      .reduce((total, signal) => total + signal.desiredQuantityLb, 0);
  const mealKitLimitLb = Math.min(
    mealKitPartner.refrigeratedCapacityAvailableLb,
    produceDemand(mealKitPartner),
  );
  const alternateExistingLb = unaffected
    .filter((item) => item.destinationId === alternatePartnerId)
    .reduce((total, item) => total + item.quantityLb, 0);
  const existingAlternateAllocation = unaffected.find(
    (item) => item.destinationId === alternatePartnerId,
  );
  const alternateLimitLb = Math.min(
    alternatePartner.refrigeratedCapacityAvailableLb,
    produceDemand(alternatePartner),
  );
  const mealKitAdditionalLb = Math.min(
    context.recovery.mealKitAdditionalLimitLb,
    affectedQuantityLb,
    Math.max(0, mealKitLimitLb - mealKit.quantityLb),
  );
  const remainingAfterMealKitLb = affectedQuantityLb - mealKitAdditionalLb;
  const alternateAdditionalLb = Math.min(
    remainingAfterMealKitLb,
    Math.max(0, alternateLimitLb - alternateExistingLb),
  );
  const addedInspectionHoldLb = remainingAfterMealKitLb - alternateAdditionalLb;
  const revisedAllocations: Allocation[] = unaffected.map((item) =>
    item.destinationId === mealKitPartnerId
      ? { ...item, quantityLb: item.quantityLb + mealKitAdditionalLb }
      : item.id === existingAlternateAllocation?.id
        ? { ...item, quantityLb: item.quantityLb + alternateAdditionalLb }
        : item,
  );

  if (alternateAdditionalLb > 0 && alternateExistingLb === 0) {
    revisedAllocations.splice(1, 0, {
      id: "ALL-108",
      productLotId: context.productLot.id,
      destinationId: alternatePartnerId,
      destinationType: "partner",
      quantityLb: alternateAdditionalLb,
      plannedArrivalAt: context.timeline.alternateArrivalAt,
      handling: "cross_dock",
      score: calculateDestinationScore({
        documentedNeed: 100,
        usabilityMatch: 100,
        receivingWindowFit: 100,
        availableCapacity: 95,
        recentServiceGap: 100,
        equityPriority: 100,
        historicalAcceptance: acceptanceHistorySignal(
          alternatePartner,
          context.productLot.category,
        ).score,
        travelPenalty: 5,
        spoilagePenalty: 2,
        refusalRiskPenalty: 2,
      }),
    });
  }

  const inspectionHoldLb = original.inspectionHoldLb + addedInspectionHoldLb;
  const quantityPlannedOutboundInTimeLb = revisedAllocations
    .filter((item) => item.destinationType !== "warehouse")
    .reduce((total, item) => total + item.quantityLb, 0);

  const option = withDerivedCapacityMetrics(
    {
      ...original,
      id: context.ids.recoveryOptionId,
      planSetId: context.ids.recoveryPlanSetId,
      name: `Recovered ${original.name}`,
      status: "selected",
      allocations: revisedAllocations,
      inspectionHoldLb,
      unallocatedLb: original.unallocatedLb,
      metrics: {
        ...original.metrics,
        quantityPlannedOutboundInTimeLb,
        expectedSpoilageLb: Math.max(original.metrics.expectedSpoilageLb, inspectionHoldLb),
        modeledHouseholdEquivalents: modeledHouseholdEquivalents(
          quantityPlannedOutboundInTimeLb,
          context.scenario.householdWeightLb,
        ),
        totalMiles: context.recovery.totalMiles,
        staffMinutes: context.recovery.staffMinutes,
        needMatchScore: context.recovery.needMatchScore,
        equityIndicator: context.recovery.equityIndicator,
        refusalRiskScore: context.recovery.refusalRiskScore,
      },
      assumptions: [
        ...original.assumptions,
        `${mealKitPartner.name} remains within confirmed capacity and demand for the recovery.`,
        ...(addedInspectionHoldLb > 0
          ? [
              `${addedInspectionHoldLb} lb that could not fit a confirmed receiving limit remains in refrigerated inspection hold.`,
            ]
          : []),
        `The ${context.scenario.modeledReplanningSeconds}-second replan is a modeled scenario interval, not measured compute time.`,
      ],
      risks: [
        {
          code: "RECEIVING_CONFIRMATION",
          level: "medium",
          message: "Alternate partner receiving staff require human confirmation.",
          blocking: false,
        },
      ],
      excludedDestinations: [
        ...original.excludedDestinations,
        {
          destinationId: canceledPartnerId,
          reason: "Receiving staff unavailable; destination canceled.",
        },
      ],
    },
    context,
  );

  return { option, issues: [] };
}

export function createRecoveryOption(
  original: PlanOption,
  context: AlmanacScenarioContext = scenarioContext,
): PlanOption {
  const result = createRecoveryOptionResult(original, context);
  return (
    result.option ?? {
      ...original,
      id: context.ids.recoveryOptionId,
      planSetId: context.ids.recoveryPlanSetId,
      status: "selected",
      risks: [
        ...original.risks,
        ...result.issues.map((item) => ({
          code: item.code,
          level: "critical" as const,
          message: item.message,
          blocking: true,
        })),
      ],
    }
  );
}

export function createRecoveryMission(
  original: PlanOption,
  context: AlmanacScenarioContext = scenarioContext,
): Mission {
  return createMission(
    createRecoveryOption(original, context),
    context.ids.recoveryMissionId,
    context,
  );
}

export function preserveCompletedMissionWork(
  originalMission: Mission,
  replacementMission: Mission,
): Mission {
  return {
    ...replacementMission,
    stops: replacementMission.stops.map((stop) => {
      const previous = originalMission.stops.find(
        (item) =>
          item.locationId === stop.locationId &&
          item.quantityPickupLb === stop.quantityPickupLb &&
          item.quantityDropoffLb === stop.quantityDropoffLb,
      );
      return previous?.status === "complete" ? { ...stop, status: "complete" as const } : stop;
    }),
  };
}

export function createRecoveryPackingPlan(
  recoveryOption: PlanOption,
  originalPackingPlan?: PackingPlan,
  context: AlmanacScenarioContext = scenarioContext,
): PackingPlan {
  const replacement = createPackingPlan(
    recoveryOption,
    context.ids.recoveryPackingPlanId,
    context,
  );
  if (!originalPackingPlan) return replacement;

  const batches = replacement.batches
    .flatMap((batch) => {
      const previous = originalPackingPlan.batches.find(
        (item) =>
          item.destinationId === batch.destinationId &&
          item.stagingLocation === batch.stagingLocation &&
          item.status === "complete",
      );
      if (!previous) return [batch];
      if (previous.quantityLb >= batch.quantityLb) {
        return [{ ...batch, status: "complete" as const }];
      }
      return [
        {
          ...batch,
          id: `${batch.id}-C`,
          quantityLb: previous.quantityLb,
          status: "complete" as const,
          instruction: `${previous.quantityLb} lb completed under ${originalPackingPlan.id}; no repacking required.`,
        },
        {
          ...batch,
          id: `${batch.id}-R`,
          quantityLb: batch.quantityLb - previous.quantityLb,
          status: "pending" as const,
          instruction: `Pack the additional ${batch.quantityLb - previous.quantityLb} lb required by recovery.`,
        },
      ];
    })
    .map((batch, index) => ({ ...batch, priority: index + 1 }));

  return {
    ...replacement,
    batches,
    status: batches.every((item) => item.status === "complete")
      ? "complete"
      : batches.some((item) => item.status === "complete")
        ? "in_progress"
        : "ready",
  };
}
