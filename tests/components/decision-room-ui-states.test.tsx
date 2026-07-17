import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DecisionRoomClient } from "@/components/plans/decision-room-client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/state/demo-state", () => ({
  useDemoState: () => ({
    state: { planOverrides: {}, approvedPlan: null, selectedPlanId: "OPT-003" },
    selectPlan: vi.fn(),
    editPlan: vi.fn(),
    approvePlan: vi.fn(),
  }),
}));

describe("DecisionRoomClient required states", () => {
  it("renders loading", () => {
    render(<DecisionRoomClient loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading plan alternatives");
  });

  it("renders empty", () => {
    render(<DecisionRoomClient planSet={null} />);
    expect(screen.getByText("No plan alternatives are available.")).toBeVisible();
  });

  it("renders error", () => {
    render(<DecisionRoomClient errorMessage="Validated plan output was unavailable." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Validated plan output was unavailable.");
  });
});
