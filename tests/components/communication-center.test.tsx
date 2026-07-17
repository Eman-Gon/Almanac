import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommunicationCenter } from "@/components/communications/communication-center";
import {
  approvePlan,
  initialDemoState,
  type DemoState,
} from "@/domain/demo/demo-state";
import { generatePlanSet } from "@/domain/planning/generate-plans";

const useDemoStateMock = vi.hoisted(() => vi.fn());

vi.mock("@/state/demo-state", () => ({
  useDemoState: () => useDemoStateMock(),
}));

function approvedState(): DemoState {
  const balanced = generatePlanSet().options.find(
    (option) => option.strategy === "balanced_release",
  );
  if (!balanced) throw new Error("Balanced Release fixture is unavailable.");
  return approvePlan(initialDemoState, balanced, "Approve seeded balanced plan.");
}

describe("CommunicationCenter", () => {
  beforeEach(() => {
    useDemoStateMock.mockReset();
    useDemoStateMock.mockReturnValue({ state: initialDemoState });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("blocks outreach preview until a plan is approved", () => {
    render(<CommunicationCenter />);

    expect(screen.getByText("Plan approval required")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review outbound plans" }),
    ).toHaveAttribute("href", "/plans/PLN-104");
    expect(
      screen.queryByRole("button", { name: "Run simulated outreach" }),
    ).not.toBeInTheDocument();
  });

  it("requires explicit authorization and creates only local synthetic responses", () => {
    const state = approvedState();
    const originalState = structuredClone(state);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    useDemoStateMock.mockReturnValue({ state });

    render(<CommunicationCenter />);

    expect(screen.getByText("South County Distribution Center")).toBeVisible();
    expect(screen.getByText("Harbor Light Pantry")).toBeVisible();
    expect(screen.getByText("Eastside Community Pantry")).toBeVisible();
    expect(screen.getByText("Community Kitchen")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Run simulated outreach" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Confirm that you approve this local simulation",
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I approve these exact scripts for a local simulation/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Run simulated outreach" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "3 synthetic responses created",
    );
    expect(screen.getAllByText("Synthetic acknowledgment")).toHaveLength(3);
    expect(screen.getAllByText("Unverified · no commitment recorded")).toHaveLength(3);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state).toEqual(originalState);
  });
});
