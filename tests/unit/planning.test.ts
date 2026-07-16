import { describe, expect, it } from "vitest";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import {
  accountedQuantityLb,
  quantityConserves,
  validatePlanOption,
} from "@/domain/planning/quantity";

describe("deterministic planning", () => {
  const set = generatePlanSet();

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
      expect(quantityConserves(option, 1_200)).toBe(true);
      expect(accountedQuantityLb(option)).toBe(1_200);
    }
  });

  it("blocks the warehouse capacity conflict", () => {
    const warehouseFirst = set.options[0];
    const validation = validatePlanOption(warehouseFirst, 1_200);
    expect(validation.approvable).toBe(false);
    expect(validation.errors[0]).toContain("780 lb");
  });

  it("recommends an approvable mixed allocation", () => {
    const mixed = set.options[2];
    expect(validatePlanOption(mixed, 1_200).approvable).toBe(true);
    expect(mixed.allocations.map((allocation) => allocation.quantityLb)).toEqual([420, 320, 400]);
    expect(mixed.inspectionHoldLb).toBe(60);
    expect(mixed.metrics.quantityDistributedInTimeLb).toBe(1_140);
  });
});
