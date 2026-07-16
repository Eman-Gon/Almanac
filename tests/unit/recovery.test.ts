import { describe, expect, it } from "vitest";
import { createMission } from "@/domain/execution/create-execution";
import { donation, partners, productLot, vehicles, warehouse } from "@/data/seed/scenario";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { accountedQuantityLb, validatePlanOption } from "@/domain/planning/quantity";
import { createRecoveryMission, createRecoveryOption } from "@/domain/recovery/create-recovery";

describe("partner-cancellation recovery", () => {
  const options = generatePlanSet().options;
  const original = options[2];
  const recovery = createRecoveryOption(original);
  const context = {
    offeredQuantityLb: donation.quantityLb,
    productLot,
    warehouse,
    partners,
    vehicle: vehicles[0],
  };

  it("removes every allocation to the canceled partner", () => {
    expect(recovery.allocations.some((allocation) => allocation.destinationId === "PAR-002")).toBe(false);
  });

  it("reassigns 260 lb to the alternate and 60 lb to meal-kit staging", () => {
    expect(recovery.allocations.find((allocation) => allocation.destinationId === "PAR-004")?.quantityLb).toBe(260);
    expect(recovery.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb).toBe(460);
    expect(accountedQuantityLb(recovery)).toBe(1_200);
    const validation = validatePlanOption(recovery, context);
    expect(validation.approvable).toBe(true);
    expect(validation.capacity.warehouseStorage.plannedQuantityLb).toBe(60);
    expect(validation.capacity.warehouseStaging).toMatchObject({
      plannedQuantityLb: 460,
      limitQuantityLb: 500,
      excessQuantityLb: 0,
    });
    expect(recovery.metrics.coldCapacityUtilizationPct).toBe(82);
    expect(recovery.metrics.refrigeratedStagingUtilizationPct).toBe(92);
  });

  it("keeps Direct Distribution recoverable by using inspection hold after receiving limits", () => {
    const directRecovery = createRecoveryOption(options[1]);

    expect(directRecovery.allocations.find((allocation) => allocation.destinationId === "PAR-004")?.quantityLb).toBe(280);
    expect(directRecovery.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb).toBe(460);
    expect(directRecovery.inspectionHoldLb).toBe(40);
    expect(accountedQuantityLb(directRecovery)).toBe(1_200);
    expect(validatePlanOption(directRecovery, context).approvable).toBe(true);
  });

  it("uses remaining refrigerated hold capacity at the cancellation boundary", () => {
    const direct = options[1];
    const boundaryPlan = {
      ...direct,
      allocations: direct.allocations.map((allocation) => {
        if (allocation.destinationId === "PAR-001") return { ...allocation, quantityLb: 380 };
        if (allocation.destinationId === "PAR-002") return { ...allocation, quantityLb: 420 };
        return allocation;
      }),
    };
    const boundaryRecovery = createRecoveryOption(boundaryPlan);

    expect(boundaryRecovery.inspectionHoldLb).toBe(80);
    expect(boundaryRecovery.metrics.quantityDistributedInTimeLb).toBe(1_120);
    expect(accountedQuantityLb(boundaryRecovery)).toBe(1_200);
    expect(validatePlanOption(boundaryRecovery, context).approvable).toBe(true);
  });

  it("creates a replacement route without mutating the original mission", () => {
    const originalMission = createMission(original);
    const replacement = createRecoveryMission(original);
    expect(originalMission.id).toBe("MSN-104");
    expect(originalMission.stops.some((stop) => stop.locationId === "PAR-002")).toBe(true);
    expect(replacement.id).toBe("MSN-105");
    expect(replacement.stops.some((stop) => stop.locationId === "PAR-002")).toBe(false);
    expect(replacement.stops.some((stop) => stop.locationId === "PAR-004")).toBe(true);
  });
});
