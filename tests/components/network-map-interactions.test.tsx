import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkMap, type MapRouteSummary } from "@/components/shared/network-map";
import { createMission } from "@/domain/execution/create-execution";
import { generatePlanSet } from "@/domain/planning/generate-plans";

vi.mock("@/state/demo-state", () => ({
  useDemoState: () => ({ state: { partnerStatusOverrides: {} } }),
}));

const plan = generatePlanSet().options[2];
const mission = createMission(plan);
const routeSummary: MapRouteSummary = {
  label: `${plan.name} · Candidate`,
  miles: plan.metrics.totalMiles,
  stops: mission.stops.length,
  loadLb: mission.stops[0].quantityPickupLb,
  status: "candidate",
};

function renderInteractiveMap() {
  render(
    <NetworkMap
      interactive
      routeSummary={routeSummary}
      routeStops={mission.stops}
      routeLocationIds={mission.stops.map((stop) => stop.locationId)}
    />,
  );
}

describe("NetworkMap interactions", () => {
  afterEach(cleanup);

  it("handles coarse wheel zoom in both directions through the non-passive listener", () => {
    renderInteractiveMap();
    const canvas = screen.getByTestId("network-map-canvas");
    const zoom = screen.getByTestId("map-zoom-status");

    expect(zoom).toHaveTextContent("100%");
    fireEvent.wheel(canvas, { deltaX: 0, deltaY: -600, deltaMode: 0 });
    expect(zoom).toHaveTextContent("125%");
    fireEvent.wheel(canvas, { deltaX: 0, deltaY: 600, deltaMode: 0 });
    expect(zoom).toHaveTextContent("100%");
  });

  it("keeps marker selection synchronized with the accessible location list", () => {
    renderInteractiveMap();
    const marker = screen.getByTestId("map-marker-PAR-002");
    const listItem = screen.getByTestId("map-location-PAR-002");

    fireEvent.click(marker);

    expect(marker).toHaveAttribute("aria-pressed", "true");
    expect(listItem).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Close location details" })).toBeVisible();
  });

  it("clamps only the route label while the marker continues to track transformed geometry", () => {
    renderInteractiveMap();
    const zoomIn = screen.getByRole("button", { name: "Zoom in map" });

    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    // Selecting the far-southeast context hub pans the viewport until the
    // clamp engages, pushing the northwest route stops past the canvas edge.
    fireEvent.click(screen.getByTestId("map-marker-PAR-010"));

    const partnerMarkerWrap = screen.getByTestId("map-marker-PAR-003").parentElement;
    const partnerLabelAnchor = screen.getByTestId("map-route-label-PAR-003").parentElement;
    const markerLeft = Number.parseFloat(partnerMarkerWrap?.style.left ?? "");
    const labelLeft = Number.parseFloat(partnerLabelAnchor?.style.left ?? "");

    expect(markerLeft).toBeLessThan(2);
    expect(labelLeft).toBe(2);
    expect(partnerMarkerWrap?.style.left).not.toBe(partnerLabelAnchor?.style.left);
  });
});
