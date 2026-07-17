import { describe, expect, it } from "vitest";
import {
  VoiceOutreachPreviewSchema,
  approveVoiceOutreachPreview,
  createVoiceOutreachPreview,
  simulateVoiceOutreach,
} from "@/domain/communications/outreach-simulation";
import {
  approvePlan,
  initialDemoState,
} from "@/domain/demo/demo-state";
import { generatePlanSet } from "@/domain/planning/generate-plans";

function approvedBalancedPlan() {
  const balanced = generatePlanSet().options.find(
    (option) => option.strategy === "balanced_release",
  );
  if (!balanced) throw new Error("Balanced Release fixture is unavailable.");
  const state = approvePlan(initialDemoState, balanced, "Approve seeded balanced plan.");
  if (!state.approvedPlan) throw new Error("Approved plan fixture was not created.");
  return state.approvedPlan;
}

describe("simulated voice outreach", () => {
  it("builds one recipient draft for every approved partner allocation", () => {
    const preview = createVoiceOutreachPreview(approvedBalancedPlan());

    expect(preview).toMatchObject({
      mode: "simulation",
      status: "draft",
      provider: null,
      communicationId: null,
      inventoryLotId: "LOT-104",
      warehouseId: "WH-001",
      mutatesOperationalState: false,
    });
    expect(preview.recipients.map((recipient) => recipient.partnerId)).toEqual([
      "PAR-001",
      "PAR-002",
      "PAR-003",
    ]);
    expect(
      preview.recipients.reduce(
        (total, recipient) => total + recipient.plannedQuantityLb,
        0,
      ),
    ).toBe(1_140);
    expect(preview.recipients[0].script).toContain("ChoiceGrid automated assistant");
    expect(preview.recipients[0].script).toContain("human-approved plan");
  });

  it("rejects outreach creation before a plan is human approved", () => {
    const balanced = generatePlanSet().options.find(
      (option) => option.strategy === "balanced_release",
    );
    if (!balanced) throw new Error("Balanced Release fixture is unavailable.");

    expect(() => createVoiceOutreachPreview(balanced)).toThrow(
      "A human-approved plan is required",
    );
  });

  it("requires a reason and human authorization before simulation", () => {
    const draft = createVoiceOutreachPreview(approvedBalancedPlan());

    expect(() => approveVoiceOutreachPreview(draft, " ")).toThrow(
      "A reason is required",
    );
    expect(() => simulateVoiceOutreach(draft)).toThrow(
      "Human preview authorization is required",
    );

    const approved = approveVoiceOutreachPreview(
      draft,
      "Verify scripts before any future transport decision.",
    );
    const completed = simulateVoiceOutreach(approved);

    expect(completed.status).toBe("simulated");
    expect(completed.approvalReason).toBe(
      "Verify scripts before any future transport decision.",
    );
    expect(completed.responses).toHaveLength(completed.recipients.length);
    expect(completed.responses.every((response) => !response.commitmentRecorded)).toBe(true);
    expect(completed.events.map((event) => event.stage)).toEqual([
      "drafted",
      "approved",
      "simulated",
    ]);
  });

  it("keeps repeat approval and simulation idempotent", () => {
    const draft = createVoiceOutreachPreview(approvedBalancedPlan());
    const approved = approveVoiceOutreachPreview(draft, "Local simulation review.");
    const completed = simulateVoiceOutreach(approved);

    expect(
      approveVoiceOutreachPreview(approved, "A different reason is ignored."),
    ).toEqual(approved);
    expect(simulateVoiceOutreach(completed)).toEqual(completed);
  });

  it("does not mutate the approved plan and rejects live transport fields", () => {
    const plan = approvedBalancedPlan();
    const originalPlan = structuredClone(plan);
    const completed = simulateVoiceOutreach(
      approveVoiceOutreachPreview(
        createVoiceOutreachPreview(plan),
        "Local simulation review.",
      ),
    );

    expect(plan).toEqual(originalPlan);
    expect(completed.responses.every((response) => response.source === "synthetic_fixture")).toBe(true);
    expect(
      VoiceOutreachPreviewSchema.safeParse({
        ...completed,
        toE164: "+14155550123",
      }).success,
    ).toBe(false);
    expect(
      VoiceOutreachPreviewSchema.safeParse({
        ...completed,
        provider: "vapi",
      }).success,
    ).toBe(false);
  });
});
