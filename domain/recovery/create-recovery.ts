import { partners, scenario } from "@/data/seed/scenario";
import { createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { estimatedHouseholdsSupported } from "@/domain/metrics/calculate";
import { withDerivedCapacityMetrics } from "@/domain/planning/generate-plans";
import { calculateDestinationScore } from "@/domain/scoring/destination-score";
import type { Allocation, AuditEvent, Mission, PackingPlan, PlanOption } from "@/domain/types";

const alternateScore = calculateDestinationScore({
  documentedNeed: 100,
  usabilityMatch: 100,
  receivingWindowFit: 100,
  availableCapacity: 95,
  recentServiceGap: 100,
  equityPriority: 100,
  travelPenalty: 5,
  spoilagePenalty: 2,
  refusalRiskPenalty: 2,
});

export function createRecoveryOption(original: PlanOption): PlanOption {
  const affectedQuantityLb = original.allocations
    .filter((allocation) => allocation.destinationId === "PAR-002")
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  const unaffected = original.allocations.filter(
    (allocation) => allocation.destinationId !== "PAR-002",
  );

  const mealKit = unaffected.find(
    (allocation) => allocation.destinationId === "PAR-003",
  );

  if (!mealKit) {
    throw new Error("Recovery requires the seeded meal-kit allocation.");
  }

  const mealKitPartner = partners.find((partner) => partner.id === "PAR-003");
  const alternatePartner = partners.find((partner) => partner.id === "PAR-004");
  if (!mealKitPartner || !alternatePartner) {
    throw new Error("Recovery requires the seeded alternate partners.");
  }
  const mealKitDemandLb = mealKitPartner.demandSignals
    .filter((signal) => signal.category === "produce")
    .reduce((total, signal) => total + signal.desiredQuantityLb, 0);
  const alternateDemandLb = alternatePartner.demandSignals
    .filter((signal) => signal.category === "produce")
    .reduce((total, signal) => total + signal.desiredQuantityLb, 0);
  const mealKitLimitLb = Math.min(
    mealKitPartner.refrigeratedCapacityAvailableLb,
    mealKitDemandLb,
  );
  const alternateExistingLb = unaffected
    .filter((allocation) => allocation.destinationId === "PAR-004")
    .reduce((total, allocation) => total + allocation.quantityLb, 0);
  const existingAlternateAllocation = unaffected.find(
    (allocation) => allocation.destinationId === "PAR-004",
  );
  const alternateLimitLb = Math.min(
    alternatePartner.refrigeratedCapacityAvailableLb,
    alternateDemandLb,
  );
  const mealKitAdditionalLb = Math.min(
    60,
    affectedQuantityLb,
    Math.max(0, mealKitLimitLb - mealKit.quantityLb),
  );
  const remainingAfterMealKitLb = affectedQuantityLb - mealKitAdditionalLb;
  const alternateAdditionalLb = Math.min(
    remainingAfterMealKitLb,
    Math.max(0, alternateLimitLb - alternateExistingLb),
  );
  const addedInspectionHoldLb = remainingAfterMealKitLb - alternateAdditionalLb;
  const revisedAllocations: Allocation[] = unaffected.map((allocation) =>
    allocation.destinationId === "PAR-003"
      ? { ...allocation, quantityLb: allocation.quantityLb + mealKitAdditionalLb }
      : allocation.id === existingAlternateAllocation?.id
        ? { ...allocation, quantityLb: allocation.quantityLb + alternateAdditionalLb }
      : allocation,
  );

  if (alternateAdditionalLb > 0 && alternateExistingLb === 0) {
    revisedAllocations.splice(1, 0, {
      id: "ALL-108",
      productLotId: original.allocations[0]?.productLotId ?? "LOT-104",
      destinationId: "PAR-004",
      destinationType: "partner",
      quantityLb: alternateAdditionalLb,
      plannedArrivalAt: "2026-07-15T12:25:00-07:00",
      handling: "cross_dock",
      score: alternateScore,
    });
  }

  const inspectionHoldLb = original.inspectionHoldLb + addedInspectionHoldLb;
  const quantityDistributedInTimeLb = revisedAllocations.reduce(
    (total, allocation) => total + allocation.quantityLb,
    0,
  );

  return withDerivedCapacityMetrics({
    ...original,
    id: "OPT-105",
    planSetId: "PLN-105",
    name: `Recovered ${original.name}`,
    status: "selected",
    allocations: revisedAllocations,
    inspectionHoldLb,
    metrics: {
      ...original.metrics,
      quantityDistributedInTimeLb,
      expectedSpoilageLb: Math.max(
        original.metrics.expectedSpoilageLb,
        inspectionHoldLb,
      ),
      estimatedHouseholdsSupported: estimatedHouseholdsSupported(
        quantityDistributedInTimeLb,
        scenario.householdWeightLb,
      ),
      totalMiles: 28.6,
      staffMinutes: 104,
      needMatchScore: 93,
      equityIndicator: 90,
      refusalRiskScore: 6,
    },
    assumptions: [
      ...original.assumptions,
      "Eastside Community Pantry is excluded after the partner canceled because receiving staff were unavailable.",
      "Community Kitchen has 500 lb of refrigerated capacity and 460 lb of confirmed produce demand for the recovery.",
      ...(addedInspectionHoldLb > 0
        ? [`${addedInspectionHoldLb} lb that could not fit a confirmed receiving limit remains in refrigerated inspection hold.`]
        : []),
      "The 11-second replan is a modeled scenario interval, not measured compute time.",
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
        destinationId: "PAR-002",
        reason: "Receiving staff unavailable; destination canceled.",
      },
    ],
  });
}

export function createRecoveryMission(original: PlanOption): Mission {
  return createMission(createRecoveryOption(original), "MSN-105");
}

export function preserveCompletedMissionWork(
  originalMission: Mission,
  replacementMission: Mission,
): Mission {
  const stops = replacementMission.stops.map((stop) => {
    const previousStop = originalMission.stops.find(
      (candidate) =>
        candidate.locationId === stop.locationId &&
        candidate.quantityPickupLb === stop.quantityPickupLb &&
        candidate.quantityDropoffLb === stop.quantityDropoffLb,
    );
    return previousStop?.status === "complete"
      ? { ...stop, status: "complete" as const }
      : stop;
  });
  return {
    ...replacementMission,
    stops,
  };
}

export function createRecoveryPackingPlan(
  recoveryOption: PlanOption,
  originalPackingPlan?: PackingPlan,
): PackingPlan {
  const replacement = createPackingPlan(recoveryOption, "PKG-105");
  if (!originalPackingPlan) return replacement;

  const batches = replacement.batches.flatMap((batch) => {
    const previousBatch = originalPackingPlan.batches.find(
      (candidate) =>
        candidate.destinationId === batch.destinationId &&
        candidate.stagingLocation === batch.stagingLocation &&
        candidate.status === "complete",
    );
    if (!previousBatch) return [batch];
    if (previousBatch.quantityLb >= batch.quantityLb) {
      return [{ ...batch, status: "complete" as const }];
    }

    return [
      {
        ...batch,
        id: `${batch.id}-C`,
        quantityLb: previousBatch.quantityLb,
        status: "complete" as const,
        instruction: `${previousBatch.quantityLb} lb completed under ${originalPackingPlan.id}; no repacking required.`,
      },
      {
        ...batch,
        id: `${batch.id}-R`,
        quantityLb: batch.quantityLb - previousBatch.quantityLb,
        status: "pending" as const,
        instruction: `Pack the additional ${batch.quantityLb - previousBatch.quantityLb} lb required by recovery.`,
      },
    ];
  }).map((batch, index) => ({ ...batch, priority: index + 1 }));
  const status = batches.every((batch) => batch.status === "complete")
    ? "complete" as const
    : batches.some((batch) => batch.status === "complete")
      ? "in_progress" as const
      : "ready" as const;

  return {
    ...replacement,
    batches,
    status,
  };
}

export function createRecoveryAuditEvents(affectedQuantityLb = 320): AuditEvent[] {
  return [
    {
      id: "AUD-103",
      eventType: "partner_canceled",
      entityType: "PartnerAgency",
      entityId: "PAR-002",
      actorType: "human",
      actorId: "demo_user",
      occurredAt: "2026-07-15T11:18:00-07:00",
      previousState: { status: "available" },
      newState: { status: "canceled", affectedQuantityLb },
      reason: "Receiving staff unavailable.",
    },
    {
      id: "AUD-103A",
      eventType: "mission_replanning",
      entityType: "Mission",
      entityId: "MSN-104",
      actorType: "system",
      actorId: "choicegrid_demo",
      occurredAt: "2026-07-15T11:18:01-07:00",
      previousState: { status: "disrupted" },
      newState: { status: "replanning", affectedQuantityLb },
    },
    {
      id: "AUD-104",
      eventType: "recovery_approved",
      entityType: "PlanOption",
      entityId: "OPT-105",
      actorType: "human",
      actorId: "demo_user",
      occurredAt: "2026-07-15T11:18:11-07:00",
      previousState: { missionId: "MSN-104", affectedQuantityLb },
      newState: { missionId: "MSN-105", modeledReplanningSeconds: scenario.modeledReplanningSeconds },
      reason: "Approved alternate-partner recovery plan.",
    },
    {
      id: "AUD-104A",
      eventType: "mission_superseded",
      entityType: "Mission",
      entityId: "MSN-104",
      actorType: "system",
      actorId: "choicegrid_demo",
      occurredAt: "2026-07-15T11:18:11-07:00",
      previousState: { status: "replanning" },
      newState: { status: "superseded", replacementMissionId: "MSN-105" },
    },
  ];
}
