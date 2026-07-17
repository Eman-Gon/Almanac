import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImpactPage from "@/app/impact/page";
import {
  approvePlan,
  createInitialDemoState,
  type DemoState,
} from "@/domain/demo/demo-state";
import { generatePlanSet } from "@/domain/planning/generate-plans";

const push = vi.fn();
const resetScenario = vi.fn();
let state: DemoState;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/state/demo-state", () => ({
  useDemoState: () => ({
    state,
    hydrated: true,
    persistedStateError: false,
    resetScenario,
  }),
}));

describe("ImpactPage persisted-state integrity", () => {
  beforeEach(() => {
    push.mockReset();
    resetScenario.mockReset();
    state = createInitialDemoState();
  });

  afterEach(cleanup);

  it("does not calculate impact by synthesizing a missing approved mission", () => {
    const approved = approvePlan(
      createInitialDemoState(),
      generatePlanSet().options[2],
      "Approve baseline.",
    );
    state = { ...approved, missions: {} };

    render(<ImpactPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impact cannot be calculated from this saved state.",
    );
    expect(screen.queryByText("Modeled spoilage avoided")).not.toBeInTheDocument();
  });

  it("keeps the pre-approval state distinct from invalid approved state", () => {
    render(<ImpactPage />);

    expect(
      screen.getByText("Impact is calculated after human approval.", { selector: "strong" }),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
