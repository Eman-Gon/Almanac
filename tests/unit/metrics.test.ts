import { describe, expect, it } from "vitest";
import { scenario, warehouse } from "@/data/seed/scenario";
import { createMission } from "@/domain/execution/create-execution";
import {
  coldCapacityUtilizationPct,
  estimatedHouseholdsSupported,
  spoilageAvoidancePct,
  totalRouteMiles,
} from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";

describe("scenario metrics", () => {
  const mixed = generatePlanSet().options[2];

  it("derives warehouse refrigerated utilization", () => {
    expect(coldCapacityUtilizationPct(warehouse)).toBe(79);
  });

  it("derives the documented household estimate", () => {
    expect(estimatedHouseholdsSupported(1_140, scenario.householdWeightLb)).toBe(380);
  });

  it("derives modeled spoilage avoidance and handles a zero baseline", () => {
    expect(spoilageAvoidancePct(1_000, 60)).toBe(94);
    expect(spoilageAvoidancePct(0, 0)).toBeNull();
  });

  it("sums seeded route-leg miles", () => {
    expect(totalRouteMiles(createMission(mixed).routeLegs)).toBe(24.8);
  });
});
