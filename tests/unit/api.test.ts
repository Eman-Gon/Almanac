import { describe, expect, it } from "vitest";
import { POST as approveRecovery } from "@/app/api/disruptions/[id]/approve-recovery/route";
import { POST as createDisruption } from "@/app/api/missions/[id]/disruptions/route";
import { POST as createMissionEvent } from "@/app/api/missions/[id]/events/route";
import { GET as getMission } from "@/app/api/missions/[id]/route";
import { POST as completePacking } from "@/app/api/packing/[id]/complete/route";
import { POST as startPacking } from "@/app/api/packing/[id]/start/route";
import { POST as approvePlan } from "@/app/api/plans/[id]/approve/route";
import { createMission, createPackingPlan } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("demo API transitions", () => {
  it("requires explicit preview mode instead of fabricating mission state", async () => {
    const stateful = await getMission(
      new Request("http://choicegrid.test/api/missions/MSN-104"),
      { params: Promise.resolve({ id: "MSN-104" }) },
    );
    const preview = await getMission(
      new Request("http://choicegrid.test/api/missions/MSN-104?preview=true"),
      { params: Promise.resolve({ id: "MSN-104" }) },
    );
    const previewPayload = await preview.json();

    expect(stateful.status).toBe(409);
    expect(preview.status).toBe(200);
    expect(previewPayload.data.projection).toBe("seed_preview_not_persisted");
  });

  it("approves a submitted edited plan without losing its quantities", async () => {
    const mixed = generatePlanSet().options[2];
    const edited = {
      ...mixed,
      metrics: {
        ...mixed.metrics,
        quantityPlannedOutboundInTimeLb: 1,
        modeledHouseholdEquivalents: 9_999,
        totalMiles: 1,
      },
      allocations: mixed.allocations.map((allocation) => {
        if (allocation.destinationId === "PAR-001") return { ...allocation, quantityLb: 440 };
        if (allocation.destinationId === "PAR-002") return { ...allocation, quantityLb: 300 };
        return allocation;
      }),
    };
    const response = await approvePlan(
      jsonRequest("http://choicegrid.test/api/plans/PLN-104/approve", {
        optionId: edited.id,
        option: edited,
        approverId: "demo_user",
        reason: "Approve edited allocation.",
      }),
      { params: Promise.resolve({ id: "PLN-104" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.approvedPlan.allocations.map((item: { quantityLb: number }) => item.quantityLb)).toEqual([440, 300, 400]);
    expect(payload.data.approvedPlan.metrics.quantityPlannedOutboundInTimeLb).toBe(1_140);
    expect(payload.data.approvedPlan.metrics.modeledHouseholdEquivalents).toBe(380);
    expect(payload.data.approvedPlan.metrics.totalMiles).toBe(24.8);
    expect(payload.data.packingPlan.batches.map((item: { quantityLb: number }) => item.quantityLb)).toEqual([440, 300, 400, 60]);
  });

  it("starts packing and completes one persisted batch without changing pounds", async () => {
    const startedResponse = await startPacking(
      jsonRequest("http://choicegrid.test/api/packing/PKG-104/start", {
        packingPlan: createPackingPlan(generatePlanSet().options[2]),
      }),
      { params: Promise.resolve({ id: "PKG-104" }) },
    );
    const started = await startedResponse.json();
    const completedResponse = await completePacking(
      jsonRequest("http://choicegrid.test/api/packing/PKG-104/complete", {
        batchId: "BAT-001",
        packingPlan: started.data.packingPlan,
      }),
      { params: Promise.resolve({ id: "PKG-104" }) },
    );
    const completed = await completedResponse.json();

    expect(completed.data.packingPlan.status).toBe("in_progress");
    expect(completed.data.packingPlan.batches[0].status).toBe("complete");
    expect(
      completed.data.packingPlan.batches.reduce(
        (total: number, batch: { quantityLb: number }) => total + batch.quantityLb,
        0,
      ),
    ).toBe(1_200);
  });

  it("supports the created recovery packing plan without synthesizing it", async () => {
    const recoveryPlan = createRecoveryOption(generatePlanSet().options[2]);
    const packingPlan = createPackingPlan(recoveryPlan, "PKG-105");
    const startedResponse = await startPacking(
      jsonRequest("http://choicegrid.test/api/packing/PKG-105/start", { packingPlan }),
      { params: Promise.resolve({ id: "PKG-105" }) },
    );
    const started = await startedResponse.json();

    expect(startedResponse.status).toBe(200);
    expect(started.data.packingPlan.id).toBe("PKG-105");
    expect(started.data.packingPlan.status).toBe("in_progress");
  });

  it("rejects out-of-order mission completion and repeated packing start", async () => {
    const mixed = generatePlanSet().options[2];
    const packingPlan = createPackingPlan(mixed);
    const firstStart = await startPacking(
      jsonRequest("http://choicegrid.test/api/packing/PKG-104/start", { packingPlan }),
      { params: Promise.resolve({ id: "PKG-104" }) },
    );
    const startedPayload = await firstStart.json();
    const repeatedStart = await startPacking(
      jsonRequest("http://choicegrid.test/api/packing/PKG-104/start", {
        packingPlan: startedPayload.data.packingPlan,
      }),
      { params: Promise.resolve({ id: "PKG-104" }) },
    );
    const outOfOrder = await createMissionEvent(
      jsonRequest("http://choicegrid.test/api/missions/MSN-104/events", {
        type: "delivery_complete",
        stopId: "STP-003",
        mission: createMission(mixed),
      }),
      { params: Promise.resolve({ id: "MSN-104" }) },
    );

    expect(repeatedStart.status).toBe(409);
    expect(outOfOrder.status).toBe(409);
  });

  it("returns intentional mission errors and supersession state", async () => {
    const missing = await createDisruption(
      jsonRequest("http://choicegrid.test/api/missions/UNKNOWN/disruptions", {
        type: "partner_canceled",
        affectedEntityId: "PAR-002",
        details: { reason: "Receiving staff unavailable." },
      }),
      { params: Promise.resolve({ id: "UNKNOWN" }) },
    );
    const mixed = { ...generatePlanSet().options[2], status: "approved" as const };
    const originalPackingPlan = createPackingPlan(mixed);
    const disruptionResponse = await createDisruption(
      jsonRequest("http://choicegrid.test/api/missions/MSN-104/disruptions", {
        type: "partner_canceled",
        affectedEntityId: "PAR-002",
        details: { reason: "Receiving staff unavailable." },
        approvedPlan: mixed,
        mission: createMission(mixed),
      }),
      { params: Promise.resolve({ id: "MSN-104" }) },
    );
    const disruptionPayload = await disruptionResponse.json();
    const recovered = await approveRecovery(
      jsonRequest("http://choicegrid.test/api/disruptions/DSP-001/approve-recovery", {
        originalPlan: mixed,
        originalMission: disruptionPayload.data.originalMission,
        originalPackingPlan,
        disruption: {
          id: disruptionPayload.data.disruption.id,
          missionId: disruptionPayload.data.disruption.missionId,
          partnerId: disruptionPayload.data.disruption.affectedEntityId,
          affectedQuantityLb: disruptionPayload.data.disruption.affectedQuantityLb,
        },
      }),
      { params: Promise.resolve({ id: "DSP-001" }) },
    );
    const recoveredPayload = await recovered.json();

    expect(missing.status).toBe(404);
    expect(disruptionResponse.status).toBe(200);
    expect(recoveredPayload.data.originalMission.status).toBe("superseded");
    expect(recoveredPayload.data.replacementMission.status).toBe("assigned");
    expect(recoveredPayload.data.replacementPackingPlan.id).toBe("PKG-105");
    expect(
      recoveredPayload.data.replacementPackingPlan.batches.some(
        (batch: { destinationId: string }) => batch.destinationId === "PAR-002",
      ),
    ).toBe(false);
  });
});
