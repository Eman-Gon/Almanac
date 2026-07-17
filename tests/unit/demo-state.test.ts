import { describe, expect, it } from "vitest";
import {
  DemoStateSchema,
  approvePlan,
  approveRecovery,
  completeMissionStop,
  createInitialDemoState,
  editPlan,
  setPackingBatchComplete,
  startPacking,
  triggerPartnerCancellation,
} from "@/domain/demo/demo-state";
import type { DemoState } from "@/domain/demo/demo-state";
import { generatePlanSet } from "@/domain/planning/generate-plans";

function editedMixedPlan() {
  const mixed = generatePlanSet().options[2];
  return {
    ...mixed,
    allocations: mixed.allocations.map((allocation) => {
      if (allocation.destinationId === "PAR-001") {
        return { ...allocation, quantityLb: 440 };
      }
      if (allocation.destinationId === "PAR-002") {
        return { ...allocation, quantityLb: 300 };
      }
      return allocation;
    }),
  };
}

function completeStops(state: DemoState, stopIds: string[]): DemoState {
  return stopIds.reduce(
    (current, stopId) => completeMissionStop(current, "MSN-104", stopId),
    state,
  );
}

describe("persisted demo state transitions", () => {
  it("propagates an edited allocation into packing, mission, and audit state", () => {
    const reason = "Shift 20 lb to the earlier receiving window.";
    const edited = editedMixedPlan();
    const afterEdit = editPlan(createInitialDemoState(), edited, reason);
    const approved = approvePlan(afterEdit, afterEdit.planOverrides[edited.id], "Approved edit.");

    expect(approved.approvedPlan?.allocations.map(({ quantityLb }) => quantityLb)).toEqual([
      440,
      300,
      400,
    ]);
    expect(approved.packingPlans["PKG-104"].batches.map(({ quantityLb }) => quantityLb)).toEqual([
      440,
      300,
      400,
      60,
    ]);
    expect(
      approved.missions["MSN-104"].stops
        .filter((stop) => stop.locationType === "partner")
        .map(({ quantityDropoffLb }) => quantityDropoffLb),
    ).toEqual([440, 300, 400]);
    expect(
      approved.auditEvents.find((event) => event.eventType === "plan_allocations_edited")
        ?.reason,
    ).toBe(reason);
  });

  it("keeps plan approval idempotent after the mission exists", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const repeated = approvePlan(approved, mixed, "Duplicate approval.");

    expect(repeated).toBe(approved);
    expect(
      repeated.auditEvents.filter((event) => event.eventType === "plan_approved"),
    ).toHaveLength(1);
  });

  it("persists per-batch completion without changing approved pounds", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const started = startPacking(approved, "PKG-104");
    const completed = setPackingBatchComplete(started, "PKG-104", "BAT-001", true);
    const hydrated = DemoStateSchema.parse(JSON.parse(JSON.stringify(completed)));

    expect(hydrated.packingPlans["PKG-104"].status).toBe("in_progress");
    expect(hydrated.packingPlans["PKG-104"].batches[0].status).toBe("complete");
    expect(
      hydrated.packingPlans["PKG-104"].batches.reduce(
        (total, batch) => total + batch.quantityLb,
        0,
      ),
    ).toBe(1_200);
    expect(hydrated.approvedPlan?.allocations.map(({ quantityLb }) => quantityLb)).toEqual([
      420,
      320,
      400,
    ]);
  });

  it("cancels the partner and original stop while preserving unaffected work", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const withCompletedStop = completeStops(approved, ["STP-001", "STP-002"]);
    const disrupted = triggerPartnerCancellation(withCompletedStop);

    expect(disrupted.partnerStatusOverrides["PAR-002"]).toBe("canceled");
    expect(disrupted.missions["MSN-104"].status).toBe("replanning");
    expect(
      disrupted.missions["MSN-104"].stops.find(
        (stop) => stop.locationId === "PAR-002",
      )?.status,
    ).toBe("canceled");
    expect(disrupted.missions["MSN-104"].stops.find((stop) => stop.id === "STP-002")?.status).toBe("complete");
    expect(disrupted.disruption?.affectedQuantityLb).toBe(320);
  });

  it("supersedes the original mission and assigns a linked replacement", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const packed = setPackingBatchComplete(
      startPacking(approved, "PKG-104"),
      "PKG-104",
      "BAT-001",
      true,
    );
    const withCompletedStop = completeStops(packed, ["STP-001", "STP-002"]);
    const recovered = approveRecovery(triggerPartnerCancellation(withCompletedStop));

    expect(recovered.missions["MSN-104"].status).toBe("superseded");
    expect(recovered.missions["MSN-105"].status).toBe("assigned");
    expect(recovered.missions["MSN-105"].stops.find((stop) => stop.locationId === "PAR-001")?.status).toBe("complete");
    expect(
      recovered.missions["MSN-105"].stops.some(
        (stop) => stop.locationId === "PAR-002",
      ),
    ).toBe(false);
    expect(recovered.packingPlans["PKG-104"].batches[0].status).toBe("complete");
    expect(recovered.packingPlans["PKG-105"].batches[0].status).toBe("complete");
    expect(recovered.packingPlans["PKG-105"].batches.some((batch) => batch.destinationId === "PAR-002")).toBe(false);
    expect(recovered.activePackingPlanId).toBe("PKG-105");
    expect(recovered.missions["MSN-105"].routeLegs).toHaveLength(3);
    expect(
      recovered.auditEvents.find((event) => event.eventType === "mission_superseded")
        ?.newState,
    ).toEqual({ status: "superseded", replacementMissionId: "MSN-105" });
  });

  it("refuses out-of-order stop completion", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const unchanged = completeMissionStop(approved, "MSN-104", "STP-004");

    expect(unchanged).toBe(approved);
    expect(unchanged.missions["MSN-104"].stops.at(-1)?.status).toBe("pending");
  });

  it("splits previously packed work from the recovery-only quantity", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const kitchenPacked = setPackingBatchComplete(
      startPacking(approved, "PKG-104"),
      "PKG-104",
      "BAT-003",
      true,
    );
    const recovered = approveRecovery(triggerPartnerCancellation(kitchenPacked));
    const kitchenBatches = recovered.packingPlans["PKG-105"].batches.filter(
      (batch) => batch.destinationId === "PAR-003",
    );

    expect(kitchenBatches.map(({ quantityLb, status }) => ({ quantityLb, status }))).toEqual([
      { quantityLb: 400, status: "complete" },
      { quantityLb: 60, status: "pending" },
    ]);
    expect(recovered.packingPlans["PKG-105"].status).toBe("in_progress");
    expect(
      recovered.packingPlans["PKG-105"].batches.reduce(
        (total, batch) => total + batch.quantityLb,
        0,
      ),
    ).toBe(1_200);
  });

  it("refuses cancellation after the affected delivery is complete", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const eastsideCompleted = completeStops(approved, ["STP-001", "STP-002", "STP-003"]);
    const unchanged = triggerPartnerCancellation(eastsideCompleted);

    expect(unchanged).toBe(eastsideCompleted);
    expect(unchanged.stage).toBe("approved");
    expect(unchanged.disruption).toBeNull();
  });

  it("does not let stop completion overwrite a superseded mission", () => {
    const mixed = generatePlanSet().options[2];
    const approved = approvePlan(createInitialDemoState(), mixed, "Approve baseline.");
    const recovered = approveRecovery(triggerPartnerCancellation(approved));
    const auditCount = recovered.auditEvents.length;
    const unchanged = completeMissionStop(recovered, "MSN-104", "STP-001");

    expect(unchanged).toBe(recovered);
    expect(unchanged.missions["MSN-104"].status).toBe("superseded");
    expect(unchanged.auditEvents).toHaveLength(auditCount);
  });

  it("creates a clean reset snapshot", () => {
    const reset = createInitialDemoState(3);

    expect(reset.stage).toBe("initial");
    expect(reset.approvedPlan).toBeNull();
    expect(reset.packingPlans).toEqual({});
    expect(reset.activePackingPlanId).toBeNull();
    expect(reset.missions).toEqual({});
    expect(reset.partnerStatusOverrides).toEqual({});
    expect(reset.resetCount).toBe(3);
  });
});
