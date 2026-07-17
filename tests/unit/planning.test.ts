import { describe, expect, it } from "vitest";
import {
  partners,
  productLot,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import {
  accountedQuantityLb,
  reconcilePlanQuantities,
  quantityConserves,
  validatePlanOption,
  type PlanValidation,
  type PlanValidationContext,
} from "@/domain/planning/quantity";
import {
  acceptanceHistorySignal,
  calculateDestinationScore,
} from "@/domain/scoring/destination-score";
import type { PartnerAgency, PlanOption } from "@/domain/types";

function issueCodes(validation: PlanValidation): string[] {
  return validation.issues.map((issue) => issue.code);
}

describe("deterministic planning", () => {
  const set = generatePlanSet();
  const balanced = set.options[2];
  const context: PlanValidationContext = {
    availableInventoryQuantityLb: productLot.availableQuantityLb,
    productLot,
    warehouse,
    partners,
    vehicle: vehicles[0],
  };

  function contextWithPartner(
    partnerId: string,
    update: (partner: PartnerAgency) => PartnerAgency,
  ): PlanValidationContext {
    return {
      ...context,
      partners: context.partners.map((partner) =>
        partner.id === partnerId ? update(partner) : partner,
      ),
    };
  }

  it("generates the three warehouse-inventory strategy families", () => {
    expect(set.options).toHaveLength(3);
    expect(set.options.map((option) => option.strategy)).toEqual([
      "hold_for_later",
      "fastest_release",
      "balanced_release",
    ]);
  });

  it("conserves every available pound in every option", () => {
    for (const option of set.options) {
      expect(quantityConserves(option, productLot.availableQuantityLb)).toBe(true);
      expect(accountedQuantityLb(option)).toBe(productLot.availableQuantityLb);
    }
  });

  it("calculates the warehouse conflict even when display risks are absent", () => {
    const holdForLater = { ...set.options[0], risks: [] };
    const validation = validatePlanOption(holdForLater, context);
    const issue = validation.issues.find(
      (candidate) =>
        candidate.code === "WAREHOUSE_STORAGE_CAPACITY_EXCEEDED",
    );

    expect(validation.approvable).toBe(false);
    expect(issue).toMatchObject({
      plannedQuantityLb: 1_200,
      limitQuantityLb: 420,
      excessQuantityLb: 780,
      source: "calculated",
    });
  });

  it("reconciles every seeded plan without double-counting expected loss", () => {
    const reconciliation = set.options.map((option) =>
      reconcilePlanQuantities(option, productLot.availableQuantityLb),
    );

    expect(reconciliation.map((result) => result.reconciles)).toEqual([true, true, true]);
    expect(reconciliation.map((result) => result.totalAccountedLb)).toEqual([1_200, 1_200, 1_200]);
    expect(reconciliation[2]).toMatchObject({
      outboundAllocatedLb: 1_140,
      retainedLongTermLb: 0,
      inspectionHoldLb: 60,
      expectedSpoilageLb: 60,
    });
  });

  it("blocks a plan whose outbound metric exceeds its allocations", () => {
    const invalidMetrics: PlanOption = {
      ...balanced,
      metrics: { ...balanced.metrics, quantityPlannedOutboundInTimeLb: 1_200 },
    };
    const result = reconcilePlanQuantities(
      invalidMetrics,
      productLot.availableQuantityLb,
    );
    const validation = validatePlanOption(invalidMetrics, context);

    expect(result.reconciles).toBe(true);
    expect(issueCodes(validation)).toContain("METRIC_QUANTITY_MISMATCH");
    expect(validation.approvable).toBe(false);
  });

  it("reports an approvable balanced allocation with derived capacity usage", () => {
    const validation = validatePlanOption(balanced, context);

    expect(validation.approvable).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(validation.capacity.warehouseStorage).toEqual({
      plannedQuantityLb: 60,
      limitQuantityLb: 420,
      excessQuantityLb: 0,
    });
    expect(validation.capacity.warehouseStaging).toEqual({
      plannedQuantityLb: 400,
      limitQuantityLb: 500,
      excessQuantityLb: 0,
    });
    expect(validation.capacity.vehiclePayload).toEqual({
      plannedQuantityLb: 1_140,
      limitQuantityLb: 1_400,
      excessQuantityLb: 0,
    });
    expect(
      validation.capacity.partnerCapacity.find(
        (usage) => usage.partnerId === "PAR-003",
      ),
    ).toEqual({
      partnerId: "PAR-003",
      allocatedQuantityLb: 400,
      compatibleCapacityLb: 500,
      activeDemandLb: 460,
    });
    expect(balanced.metrics.quantityPlannedOutboundInTimeLb).toBe(1_140);
  });

  it("uses blocking risk text only as a display fallback", () => {
    const staleRiskPlan: PlanOption = {
      ...balanced,
      risks: [
        {
          code: "STALE_FIXTURE_WARNING",
          level: "critical",
          message: "Stale display-only warning.",
          blocking: true,
        },
      ],
    };
    const validation = validatePlanOption(staleRiskPlan, context);

    expect(validation.approvable).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.displayMessage).toBe("Stale display-only warning.");
  });

  it("rejects nonnegative and conservation violations", () => {
    const invalid: PlanOption = {
      ...balanced,
      allocations: balanced.allocations.map((allocation, index) =>
        index === 0 ? { ...allocation, quantityLb: -1 } : allocation,
      ),
    };
    const validation = validatePlanOption(invalid, context);

    expect(issueCodes(validation)).toContain("INVALID_QUANTITY");
    expect(issueCodes(validation)).toContain("QUANTITY_MISMATCH");
  });

  it("aggregates duplicate-destination quantities for staging, partner capacity, and demand", () => {
    const mealKit = balanced.allocations.find(
      (allocation) => allocation.destinationId === "PAR-003",
    );
    if (!mealKit) throw new Error("Expected seeded meal-kit allocation.");

    const aggregateOverflow: PlanOption = {
      ...balanced,
      allocations: [
        balanced.allocations[0],
        { ...balanced.allocations[1], quantityLb: 219 },
        mealKit,
        { ...mealKit, id: "ALL-008", quantityLb: 101 },
      ],
    };
    const validation = validatePlanOption(aggregateOverflow, context);

    expect(accountedQuantityLb(aggregateOverflow)).toBe(1_200);
    expect(issueCodes(validation)).toEqual(
      expect.arrayContaining([
        "WAREHOUSE_STAGING_CAPACITY_EXCEEDED",
        "PARTNER_CAPACITY_EXCEEDED",
        "PARTNER_DEMAND_EXCEEDED",
      ]),
    );
  });

  it("checks warehouse storage and separate refrigerated staging limits", () => {
    const storageValidation = validatePlanOption(balanced, {
      ...context,
      warehouse: {
        ...context.warehouse,
        occupiedRefrigeratedLb: 1_941,
      },
    });
    const stagingValidation = validatePlanOption(balanced, {
      ...context,
      warehouse: {
        ...context.warehouse,
        refrigeratedStagingCapacityAvailableLb: 399,
      },
    });

    expect(issueCodes(storageValidation)).toContain(
      "WAREHOUSE_STORAGE_CAPACITY_EXCEEDED",
    );
    expect(issueCodes(stagingValidation)).toContain(
      "WAREHOUSE_STAGING_CAPACITY_EXCEEDED",
    );
  });

  it("rejects cross-dock-only outbound quantity edits from an inactive warehouse", () => {
    const fastest = set.options[1];
    const removedQuantityLb = fastest.allocations[2].quantityLb;
    const crossDockOnlyEdit: PlanOption = {
      ...fastest,
      allocations: fastest.allocations.map((allocation, index) => ({
        ...allocation,
        quantityLb: index === 2 ? 0 : allocation.quantityLb,
      })),
      unallocatedLb: removedQuantityLb,
      metrics: {
        ...fastest.metrics,
        quantityPlannedOutboundInTimeLb:
          fastest.metrics.quantityPlannedOutboundInTimeLb - removedQuantityLb,
      },
    };

    const validation = validatePlanOption(crossDockOnlyEdit, {
      ...context,
      warehouse: { ...context.warehouse, active: false },
    });

    expect(validation.capacity.warehouseStorage.plannedQuantityLb).toBe(0);
    expect(validation.capacity.warehouseStaging.plannedQuantityLb).toBe(0);
    expect(validation.capacity.vehiclePayload.plannedQuantityLb).toBe(800);
    expect(issueCodes(validation)).toContain("WAREHOUSE_UNAVAILABLE");
    expect(validation.approvable).toBe(false);
  });

  it("rejects partner status, category, capacity, and expired demand", () => {
    const canceled = validatePlanOption(
      balanced,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        status: "canceled",
      })),
    );
    const wrongCategory = validatePlanOption(
      balanced,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        acceptedCategories: ["shelf_stable"],
      })),
    );
    const capacityExceeded = validatePlanOption(
      balanced,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        refrigeratedCapacityAvailableLb: 399,
      })),
    );
    const expiredDemand = validatePlanOption(
      balanced,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        demandSignals: partner.demandSignals.map((signal) => ({
          ...signal,
          validUntil: "2026-07-15T12:00:00-07:00",
        })),
      })),
    );

    expect(issueCodes(canceled)).toContain("PARTNER_UNAVAILABLE");
    expect(issueCodes(wrongCategory)).toContain(
      "PARTNER_CATEGORY_INCOMPATIBLE",
    );
    expect(issueCodes(capacityExceeded)).toContain(
      "PARTNER_CAPACITY_EXCEEDED",
    );
    expect(issueCodes(expiredDemand)).toContain("PARTNER_DEMAND_EXPIRED");
  });

  it("rejects receiving-window violations", () => {
    const latePlan: PlanOption = {
      ...balanced,
      allocations: balanced.allocations.map((allocation) =>
        allocation.destinationId === "PAR-001"
          ? {
              ...allocation,
              plannedArrivalAt: "2026-07-15T12:30:00-07:00",
            }
          : allocation,
      ),
    };

    expect(
      issueCodes(validatePlanOption(latePlan, context)),
    ).toContain("PARTNER_WINDOW_INFEASIBLE");
  });

  it("rejects unavailable, temperature-incompatible, and overloaded vehicles", () => {
    const validation = validatePlanOption(balanced, {
      ...context,
      vehicle: {
        ...context.vehicle,
        capacityLb: 1_139,
        temperatureCapability: ["ambient"],
        status: "maintenance",
      },
    });

    expect(issueCodes(validation)).toEqual(
      expect.arrayContaining([
        "VEHICLE_UNAVAILABLE",
        "VEHICLE_TEMPERATURE_INCOMPATIBLE",
        "VEHICLE_CAPACITY_EXCEEDED",
      ]),
    );
  });

  it("uses category acceptance history as a bounded, sample-aware score signal", () => {
    const harbor = partners.find((partner) => partner.id === "PAR-001");
    if (!harbor) throw new Error("Expected seeded Harbor Light partner.");
    const strong = acceptanceHistorySignal(harbor, productLot.category);
    const sparse = acceptanceHistorySignal(
      {
        ...harbor,
        acceptanceHistory: [
          {
            ...harbor.acceptanceHistory[0],
            offeredCount: 4,
            acceptedCount: 3,
            refusedCount: 1,
            shortReceiptCount: 0,
            acceptanceRatePct: 75,
            sampleSize: 4,
          },
        ],
      },
      productLot.category,
    );
    const withoutHistory = acceptanceHistorySignal(
      { ...harbor, acceptanceHistory: [] },
      productLot.category,
    );
    const base = {
      documentedNeed: 80,
      usabilityMatch: 80,
      receivingWindowFit: 80,
      availableCapacity: 80,
      recentServiceGap: 80,
      equityPriority: 80,
      travelPenalty: 0,
      spoilagePenalty: 0,
      refusalRiskPenalty: 0,
    };

    expect(strong).toMatchObject({ score: 90, confidence: "high" });
    expect(sparse).toMatchObject({ score: 0, confidence: "low" });
    expect(withoutHistory).toMatchObject({ score: 0, confidence: "unknown" });
    expect(
      calculateDestinationScore({ ...base, historicalAcceptance: strong.score }).total,
    ).toBeGreaterThan(
      calculateDestinationScore({ ...base, historicalAcceptance: sparse.score }).total,
    );
  });
});
