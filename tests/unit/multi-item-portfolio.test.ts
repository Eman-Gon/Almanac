import { describe, expect, it } from "vitest";
import { multiItemScenario } from "@/data/seed/multi-item-scenario";
import {
  buildMultiItemPlanPreview,
  MultiItemScenarioSchema,
  rankMultiItemLots,
  reconcileMultiItemPlan,
} from "@/domain/inventory/multi-item-portfolio";

describe("multi-item warehouse portfolio", () => {
  it("validates four independent synthetic product lots", () => {
    const result = MultiItemScenarioSchema.safeParse(multiItemScenario);

    expect(result.success).toBe(true);
    expect(multiItemScenario.lots.map((lot) => lot.productName)).toEqual([
      "Peanut butter",
      "Cabbage",
      "Blueberries",
      "Frozen chicken",
    ]);
    expect(new Set(multiItemScenario.lots.map((lot) => lot.id)).size).toBe(4);
  });

  it("ranks lots deterministically from deadline, risk, and compatible storage pressure", () => {
    const ranked = rankMultiItemLots(multiItemScenario);

    expect(ranked.map((entry) => entry.lot.id)).toEqual([
      "LOT-M203",
      "LOT-M202",
      "LOT-M204",
      "LOT-M201",
    ]);
    expect(ranked.map((entry) => entry.urgencyScore)).toEqual([83, 67, 62, 11]);
    expect(ranked.find((entry) => entry.lot.id === "LOT-M204")).toMatchObject({
      planningBlocked: true,
      urgencyBand: "high",
    });
  });

  it("builds a grouped plan while conserving each product lot independently", () => {
    const plan = buildMultiItemPlanPreview(multiItemScenario);

    expect(plan.plannedOutboundQuantityLb).toBe(2_120);
    expect(plan.retainedQuantityLb).toBe(160);
    expect(plan.inspectionHoldLb).toBe(680);
    expect(plan.reconciliation).toMatchObject({
      totalAvailableQuantityLb: 2_960,
      totalAccountedQuantityLb: 2_960,
      reconciles: true,
      issues: [],
    });
    expect(plan.outreachGroups).toHaveLength(4);
    expect(
      plan.allocations.filter((allocation) => allocation.productLotId === "LOT-M204"),
    ).toHaveLength(0);
    expect(
      plan.dispositions.find((disposition) => disposition.productLotId === "LOT-M204"),
    ).toMatchObject({ inspectionHoldLb: 680, retainedQuantityLb: 0 });
  });

  it("fails per-lot conservation even when aggregate pounds remain unchanged", () => {
    const plan = buildMultiItemPlanPreview(multiItemScenario);
    const tamperedAllocations = plan.allocations.map((allocation, index) =>
      index === 0
        ? { ...allocation, productLotId: "LOT-M202" }
        : allocation,
    );

    const reconciliation = reconcileMultiItemPlan(
      multiItemScenario.lots,
      tamperedAllocations,
      plan.dispositions,
    );

    expect(reconciliation.totalAvailableQuantityLb).toBe(
      reconciliation.totalAccountedQuantityLb,
    );
    expect(reconciliation.reconciles).toBe(false);
    expect(reconciliation.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("LOT-M202"),
        expect.stringContaining("LOT-M203"),
      ]),
    );
  });

  it("groups multiple products into one partner draft without recording a commitment", () => {
    const plan = buildMultiItemPlanPreview(multiItemScenario);
    const harbor = plan.outreachGroups.find(
      (group) => group.partnerId === "PAR-001",
    );

    expect(harbor).toMatchObject({
      partnerName: "Harbor Light Pantry",
      allocatedQuantityLb: 620,
      capacityLb: 700,
    });
    expect(harbor?.lineItems.map((line) => line.productName)).toEqual([
      "Blueberries",
      "Peanut butter",
    ]);
    expect(harbor?.draft).toContain("no inventory is reserved");
    expect(harbor?.draft).toContain("no commitment is recorded");
  });
});
