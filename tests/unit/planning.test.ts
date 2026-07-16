import { describe, expect, it } from "vitest";
import {
  donation,
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
import type { PartnerAgency, PlanOption } from "@/domain/types";

function issueCodes(validation: PlanValidation): string[] {
  return validation.issues.map((issue) => issue.code);
}

describe("deterministic planning", () => {
  const set = generatePlanSet();
  const mixed = set.options[2];
  const context: PlanValidationContext = {
    offeredQuantityLb: donation.quantityLb,
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

  it("generates the three approved strategy families", () => {
    expect(set.options).toHaveLength(3);
    expect(set.options.map((option) => option.strategy)).toEqual([
      "warehouse_first",
      "direct_distribution",
      "mixed",
    ]);
  });

  it("conserves every offered pound in every option", () => {
    for (const option of set.options) {
      expect(quantityConserves(option, donation.quantityLb)).toBe(true);
      expect(accountedQuantityLb(option)).toBe(donation.quantityLb);
    }
  });

  it("calculates the warehouse conflict even when display risks are absent", () => {
    const warehouseFirst = { ...set.options[0], risks: [] };
    const validation = validatePlanOption(warehouseFirst, context);
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
    const reconciliation = set.options.map((option) => reconcilePlanQuantities(option, donation.quantityLb));

    expect(reconciliation.map((result) => result.reconciles)).toEqual([true, true, true]);
    expect(reconciliation.map((result) => result.totalAccountedLb)).toEqual([1_200, 1_200, 1_200]);
    expect(reconciliation[2]).toMatchObject({
      deliveredBeforeRiskLb: 1_140,
      inspectionHoldLb: 60,
      expectedLossLb: 0,
      holdOrLossLb: 60,
    });
  });

  it("blocks a plan whose displayed outcome buckets exceed the offer", () => {
    const invalidMetrics: PlanOption = {
      ...mixed,
      metrics: { ...mixed.metrics, quantityDistributedInTimeLb: 1_200 },
    };
    const result = reconcilePlanQuantities(invalidMetrics, donation.quantityLb);
    const validation = validatePlanOption(invalidMetrics, context);

    expect(result.reconciles).toBe(false);
    expect(issueCodes(validation)).toContain("METRIC_QUANTITY_MISMATCH");
    expect(validation.approvable).toBe(false);
  });

  it("reports an approvable mixed allocation with derived capacity usage", () => {
    const validation = validatePlanOption(mixed, context);

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
      plannedQuantityLb: 1_200,
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
    expect(mixed.metrics.quantityDistributedInTimeLb).toBe(1_140);
  });

  it("uses blocking risk text only as a display fallback", () => {
    const staleRiskPlan: PlanOption = {
      ...mixed,
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
      ...mixed,
      allocations: mixed.allocations.map((allocation, index) =>
        index === 0 ? { ...allocation, quantityLb: -1 } : allocation,
      ),
    };
    const validation = validatePlanOption(invalid, context);

    expect(issueCodes(validation)).toContain("INVALID_QUANTITY");
    expect(issueCodes(validation)).toContain("QUANTITY_MISMATCH");
  });

  it("aggregates duplicate-destination quantities for staging, partner capacity, and demand", () => {
    const mealKit = mixed.allocations.find(
      (allocation) => allocation.destinationId === "PAR-003",
    );
    if (!mealKit) throw new Error("Expected seeded meal-kit allocation.");

    const aggregateOverflow: PlanOption = {
      ...mixed,
      allocations: [
        mixed.allocations[0],
        { ...mixed.allocations[1], quantityLb: 219 },
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
    const storageValidation = validatePlanOption(mixed, {
      ...context,
      warehouse: {
        ...context.warehouse,
        occupiedRefrigeratedLb: 1_941,
      },
    });
    const stagingValidation = validatePlanOption(mixed, {
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

  it("rejects partner status, category, capacity, and expired demand", () => {
    const canceled = validatePlanOption(
      mixed,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        status: "canceled",
      })),
    );
    const wrongCategory = validatePlanOption(
      mixed,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        acceptedCategories: ["shelf_stable"],
      })),
    );
    const capacityExceeded = validatePlanOption(
      mixed,
      contextWithPartner("PAR-003", (partner) => ({
        ...partner,
        refrigeratedCapacityAvailableLb: 399,
      })),
    );
    const expiredDemand = validatePlanOption(
      mixed,
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
      ...mixed,
      allocations: mixed.allocations.map((allocation) =>
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
    const validation = validatePlanOption(mixed, {
      ...context,
      vehicle: {
        ...context.vehicle,
        capacityLb: 1_199,
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
});
