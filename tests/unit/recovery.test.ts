import { describe, expect, it } from "vitest";
import { createMission } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { accountedQuantityLb, validatePlanOption } from "@/domain/planning/quantity";
import { createRecoveryMission, createRecoveryOption } from "@/domain/recovery/create-recovery";

describe("pantry-cancellation recovery", () => {
  const original = generatePlanSet().options[2];
  const recovery = createRecoveryOption(original);

  it("removes every allocation to the canceled partner", () => {
    expect(recovery.allocations.some((allocation) => allocation.destinationId === "PAR-002")).toBe(false);
  });

  it("reassigns 260 lb to the alternate and 60 lb to meal-kit staging", () => {
    expect(recovery.allocations.find((allocation) => allocation.destinationId === "PAR-004")?.quantityLb).toBe(260);
    expect(recovery.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb).toBe(460);
    expect(accountedQuantityLb(recovery)).toBe(1_200);
    expect(validatePlanOption(recovery, 1_200).approvable).toBe(true);
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
