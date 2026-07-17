import { describe, expect, it } from "vitest";
import { scenario, warehouse } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import {
  coldCapacityUtilizationPct,
  modeledHouseholdEquivalents,
  plannedColdStorageUtilizationPct,
  refrigeratedStagingUtilizationPct,
  spoilageAvoidancePct,
  totalRouteMiles,
} from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";

describe("scenario metrics", () => {
  const balanced = generatePlanSet().options[2];

  it("derives warehouse refrigerated utilization", () => {
    expect(coldCapacityUtilizationPct(warehouse)).toBe(79);
  });

  it("separates planned cold storage from short-dwell staging", () => {
    const [holdForLater, fastest, recommended] = generatePlanSet().options;

    expect(plannedColdStorageUtilizationPct(holdForLater, warehouse)).toBe(139);
    expect(plannedColdStorageUtilizationPct(fastest, warehouse)).toBe(79);
    expect(plannedColdStorageUtilizationPct(recommended, warehouse)).toBe(82);
    expect(refrigeratedStagingUtilizationPct(recommended, warehouse)).toBe(80);
  });

  it("derives the documented household estimate", () => {
    expect(modeledHouseholdEquivalents(1_140, scenario.householdWeightLb)).toBe(380);
  });

  it("derives modeled spoilage avoidance and handles a zero baseline", () => {
    expect(spoilageAvoidancePct(1_000, 60)).toBe(94);
    expect(spoilageAvoidancePct(0, 0)).toBeNull();
  });

  it("sums seeded route-leg miles", () => {
    const [holdForLater, fastest] = generatePlanSet().options;
    expect(totalRouteMiles(createMission(holdForLater).routeLegs)).toBe(0);
    expect(totalRouteMiles(createMission(fastest).routeLegs)).toBe(45.7);
    expect(totalRouteMiles(createMission(balanced).routeLegs)).toBe(24.8);
  });
});
