import { describe, expect, it } from "vitest";
import { createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";

describe("approved-plan execution", () => {
  const mixed = generatePlanSet().options[2];

  it("derives packing batches without changing allocation quantities", () => {
    const packing = createPackingPlan(mixed);
    expect(packing.batches.reduce((total, batch) => total + batch.quantityLb, 0)).toBe(1_200);
    expect(packing.batches.at(-1)?.instruction).toContain("supervisor inspection");
  });

  it("creates a temperature-compatible assigned mission", () => {
    const mission = createMission(mixed);
    expect(mission.status).toBe("assigned");
    expect(mission.vehicleId).toBe("VEH-001");
    expect(mission.stops.reduce((total, stop) => total + stop.quantityDropoffLb, 0)).toBe(1_200);
  });
});
