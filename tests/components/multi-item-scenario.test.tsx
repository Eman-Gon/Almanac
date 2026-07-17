import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MultiItemScenarioClient } from "@/components/inventory/multi-item-scenario-client";

describe("MultiItemScenarioClient", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows four ranked lots and keeps uncertain chicken on inspection hold", () => {
    render(<MultiItemScenarioClient />);

    expect(
      screen.getByRole("heading", {
        name: "Four products. One coordinated release preview.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /Blueberries/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Cabbage/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Frozen chicken/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Peanut butter/ })).toBeVisible();
    expect(screen.getAllByText("2,960 lb", { exact: true })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Frozen chicken/ }));

    expect(screen.getByText("Staff check required")).toBeVisible();
    expect(
      screen.getByText("Staff confirmation is required before release planning"),
    ).toBeVisible();
    expect(
      screen.getByRole("row", { name: /Frozen chicken LOT-M204 680 lb 0 lb 0 lb 680 lb Pass/ }),
    ).toBeVisible();
  });

  it("requires human authorization before revealing grouped outreach drafts", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<MultiItemScenarioClient />);

    const approveButton = screen.getByRole("button", {
      name: "Approve coordinated preview",
    });
    expect(approveButton).toBeDisabled();
    expect(screen.queryByText("Preview approved locally")).not.toBeInTheDocument();
    expect(
      screen.getByText("Outreach drafts are not active"),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I reviewed all four lot totals/,
      }),
    );
    expect(approveButton).toBeEnabled();
    fireEvent.click(approveButton);

    expect(screen.getByRole("status")).toHaveTextContent(
      "4 grouped outreach drafts generated",
    );
    expect(screen.getByText("Harbor Light Pantry")).toBeVisible();
    expect(screen.getByText("Eastside Community Pantry")).toBeVisible();
    expect(screen.getByText("Community Kitchen")).toBeVisible();
    expect(screen.getByText("Northside Family Resource Center")).toBeVisible();
    expect(
      screen.getAllByText("Synthetic draft · not sent · no commitment recorded"),
    ).toHaveLength(4);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
