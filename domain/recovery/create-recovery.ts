import { scenario } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import { calculateDestinationScore } from "@/domain/scoring/destination-score";
import type { Allocation, AuditEvent, Mission, PlanOption } from "@/domain/types";

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
  const unaffected = original.allocations.filter(
    (allocation) => allocation.destinationId !== "PAR-002",
  );

  const mealKit = unaffected.find(
    (allocation) => allocation.destinationId === "PAR-003",
  );

  const revisedAllocations: Allocation[] = unaffected.map((allocation) =>
    allocation.destinationId === "PAR-003"
      ? { ...allocation, id: "ALL-107", quantityLb: 460 }
      : { ...allocation, id: "ALL-105" },
  );

  revisedAllocations.splice(1, 0, {
    id: "ALL-108",
    productLotId: "LOT-104",
    destinationId: "PAR-004",
    destinationType: "partner",
    quantityLb: 260,
    plannedArrivalAt: "2026-07-15T12:25:00-07:00",
    handling: "cross_dock",
    score: alternateScore,
  });

  if (!mealKit) {
    throw new Error("Recovery requires the seeded meal-kit allocation.");
  }

  return {
    ...original,
    id: "OPT-105",
    planSetId: "PLN-105",
    name: "Recovered Mixed Plan",
    status: "selected",
    allocations: revisedAllocations,
    metrics: {
      ...original.metrics,
      totalMiles: 28.6,
      staffMinutes: 104,
      needMatchScore: 93,
      equityIndicator: 90,
      refusalRiskScore: 6,
    },
    assumptions: [
      ...original.assumptions,
      "Eastside Community Pantry is excluded after its receiving staff cancellation.",
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
  };
}

export function createRecoveryMission(original: PlanOption): Mission {
  return createMission(createRecoveryOption(original), "MSN-105");
}

export function createRecoveryAuditEvents(): AuditEvent[] {
  return [
    {
      id: "AUD-103",
      eventType: "partner_canceled",
      entityType: "Mission",
      entityId: "MSN-104",
      actorType: "human",
      actorId: "demo_user",
      occurredAt: "2026-07-15T11:18:00-07:00",
      previousState: { partnerId: "PAR-002", affectedQuantityLb: 320 },
      newState: { status: "replanning" },
      reason: "Receiving staff unavailable.",
    },
    {
      id: "AUD-104",
      eventType: "recovery_approved",
      entityType: "Mission",
      entityId: "MSN-105",
      actorType: "human",
      actorId: "demo_user",
      occurredAt: "2026-07-15T11:18:11-07:00",
      previousState: { missionId: "MSN-104", affectedQuantityLb: 320 },
      newState: { missionId: "MSN-105", modeledReplanningSeconds: scenario.modeledReplanningSeconds },
      reason: "Approved alternate-partner recovery plan.",
    },
  ];
}
