import { describe, expect, it } from "vitest";
import { createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";

describe("approved-plan execution", () => {
  const mixed = generatePlanSet().options[2];

  it("derives packing batches without changing allocation quantities", () => {
    const packing = createPackingPlan(mixed);
    expect(packing.batches.reduce((total, batch) => total + batch.quantityLb, 0)).toBe(1_200);
    expect(packing.batches.every((batch) => batch.status === "pending")).toBe(true);
    expect(packing.batches.at(-1)?.instruction).toContain("supervisor inspection");
  });

  it("creates a temperature-compatible assigned mission", () => {
    const mission = createMission(mixed);
    expect(mission.status).toBe("assigned");
    expect(mission.vehicleId).toBe("VEH-001");
    expect(mission.stops.reduce((total, stop) => total + stop.quantityDropoffLb, 0)).toBe(1_200);
    expect(totalRouteMiles(mission.routeLegs)).toBe(mixed.metrics.totalMiles);
  });

  it("uses deterministic route totals for each strategy", () => {
    const [warehouseFirst, direct] = generatePlanSet().options;
    const directMission = createMission(direct);
    const warehouseMission = createMission(warehouseFirst);

    expect(totalRouteMiles(directMission.routeLegs)).toBe(45.7);
    expect(directMission.stops.reduce((total, stop) => total + stop.quantityDropoffLb, 0)).toBe(1_200);
    expect(totalRouteMiles(warehouseMission.routeLegs)).toBe(18.4);
    expect(warehouseMission.stops).toHaveLength(2);
    expect(warehouseMission.stops[1].quantityDropoffLb).toBe(1_200);
  });
});
