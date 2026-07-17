import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImpactPage from "@/app/impact/page";
import { DemoStateProvider } from "@/state/demo-state";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("persisted demo-state hydration", () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
  });

  afterEach(cleanup);

  it("surfaces corrupt saved state on Impact instead of treating it as pre-approval", async () => {
    window.localStorage.setItem("choicegrid-demo-v3", "{not valid JSON");

    render(
      <DemoStateProvider>
        <ImpactPage />
      </DemoStateProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impact cannot be calculated from this saved state.",
    );
    expect(
      screen.queryByText("Impact is calculated after human approval.", {
        selector: "strong",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restart demo" }));

    await waitFor(() => {
      expect(
        screen.getByText("Impact is calculated after human approval.", {
          selector: "strong",
        }),
      ).toBeVisible();
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
