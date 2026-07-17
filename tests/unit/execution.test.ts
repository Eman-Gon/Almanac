import { describe, expect, it } from "vitest";
import { createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";

describe("approved-plan execution", () => {
  const balanced = generatePlanSet().options[2];

  it("derives packing batches without changing allocation quantities", () => {
    const packing = createPackingPlan(balanced);
    expect(packing.batches.reduce((total, batch) => total + batch.quantityLb, 0)).toBe(1_200);
    expect(packing.batches.every((batch) => batch.status === "pending")).toBe(true);
    expect(packing.batches.at(-1)?.instruction).toContain("supervisor inspection");
  });

  it("creates a temperature-compatible assigned mission", () => {
    const mission = createMission(balanced);
    expect(mission.status).toBe("assigned");
    expect(mission.inventoryLotId).toBe("LOT-104");
    expect(mission.vehicleId).toBe("VEH-001");
    expect(mission.stops[0]).toMatchObject({
      locationId: "WH-001",
      locationType: "warehouse",
      quantityPickupLb: 1_140,
    });
    expect(mission.stops.some((stop) => stop.locationType === "warehouse")).toBe(true);
    expect(mission.stops.reduce((total, stop) => total + stop.quantityDropoffLb, 0)).toBe(1_140);
    expect(totalRouteMiles(mission.routeLegs)).toBe(balanced.metrics.totalMiles);
  });

  it("uses deterministic route totals for each strategy", () => {
    const [holdForLater, fastest] = generatePlanSet().options;
    const fastestMission = createMission(fastest);
    const holdMission = createMission(holdForLater);

    expect(totalRouteMiles(fastestMission.routeLegs)).toBe(45.7);
    expect(fastestMission.stops.reduce((total, stop) => total + stop.quantityDropoffLb, 0)).toBe(1_200);
    expect(totalRouteMiles(holdMission.routeLegs)).toBe(0);
    expect(holdMission.stops).toHaveLength(1);
    expect(holdMission.stops[0]).toMatchObject({
      locationId: "WH-001",
      quantityPickupLb: 0,
      quantityDropoffLb: 0,
    });
  });

  it("preserves each partner's seeded receiving window on mission stops", () => {
    const mission = createMission(balanced);
    const recoveryMission = createMission(createRecoveryOption(balanced), "MSN-105");

    expect(mission.stops.find((stop) => stop.locationId === "PAR-001")?.arrivalWindow).toEqual({
      start: "2026-07-15T09:30:00-07:00",
      end: "2026-07-15T12:00:00-07:00",
    });
    expect(mission.stops.find((stop) => stop.locationId === "PAR-002")?.arrivalWindow).toEqual({
      start: "2026-07-15T10:00:00-07:00",
      end: "2026-07-15T12:30:00-07:00",
    });
    expect(recoveryMission.stops.find((stop) => stop.locationId === "PAR-004")?.arrivalWindow).toEqual({
      start: "2026-07-15T09:30:00-07:00",
      end: "2026-07-15T14:00:00-07:00",
    });
  });
});
