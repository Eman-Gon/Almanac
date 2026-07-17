import { expect, test, type Locator, type Page } from "@playwright/test";

// A canvas point that avoids markers, chips, and fixed chrome so wheel/drag
// gestures reach the map surface instead of an interactive child.
async function emptyCanvasPoint(page: Page) {
  const canvas = page.getByTestId("network-map-canvas");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) throw new Error("Map canvas bounds are unavailable");
  return { bounds, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

async function currentZoom(canvas: Locator): Promise<number> {
  const value = await canvas.getAttribute("data-zoom");
  expect(value).not.toBeNull();
  return Number(value);
}

async function viewportTransform(page: Page): Promise<string> {
  return page.getByTestId("map-viewport").evaluate((node) => (node as HTMLElement).style.transform);
}

test("map supports mouse-wheel zoom, trackpad pan, and pinch zoom", async ({ page }) => {
  const passiveWheelErrors: string[] = [];
  page.on("console", (message) => {
    if (/Unable to preventDefault inside passive event listener/i.test(message.text())) {
      passiveWheelErrors.push(message.text());
    }
  });
  await page.goto("/map");

  const canvas = page.getByTestId("network-map-canvas");
  const zoom = page.getByTestId("map-zoom-status");
  await expect(canvas).toHaveAttribute("data-zoom", /\d+/);
  const baseZoom = await currentZoom(canvas);
  await expect(zoom).toHaveText(`Z${baseZoom}`);

  const point = await emptyCanvasPoint(page);
  await page.mouse.move(point.x, point.y);

  // Coarse mouse-wheel deltas step the tile zoom.
  await page.mouse.wheel(0, -600);
  await expect(canvas).toHaveAttribute("data-zoom", String(baseZoom + 1));
  await page.waitForTimeout(150);
  await page.mouse.wheel(0, 600);
  await expect(canvas).toHaveAttribute("data-zoom", String(baseZoom));

  await page.getByRole("button", { name: "Zoom in map" }).click();
  await expect(canvas).toHaveAttribute("data-zoom", String(baseZoom + 1));

  // Small unmodified trackpad deltas pan without changing zoom.
  await page.mouse.move(point.x, point.y);
  const beforeTrackpadPan = await viewportTransform(page);
  await page.mouse.wheel(0, 24);
  await expect.poll(() => viewportTransform(page)).not.toBe(beforeTrackpadPan);
  await expect(canvas).toHaveAttribute("data-zoom", String(baseZoom + 1));

  // Pinch gestures arrive as ctrl-modified wheel events and step the zoom.
  await page.waitForTimeout(150);
  await canvas.evaluate((node, position) => {
    node.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: position.x,
      clientY: position.y,
      ctrlKey: true,
      deltaY: -1,
    }));
  }, { x: point.x, y: point.y });
  await expect(canvas).toHaveAttribute("data-zoom", String(baseZoom + 2));

  // Dragging pans the world layer.
  const beforeMouseDrag = await viewportTransform(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 90, point.y + 60, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => viewportTransform(page)).not.toBe(beforeMouseDrag);
  expect(passiveWheelErrors).toEqual([]);
});

test("route stop labels and geometry stay aligned in the stacked layout", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 652 });
  await page.goto("/map");

  const canvas = page.getByTestId("network-map-canvas");
  const labels = page.locator("[data-testid^=map-route-label-]");
  const assertMarkerTracksRoute = async (locationId: string) => {
    const markerBounds = await page.getByTestId(`map-marker-${locationId}`).boundingBox();
    const nodeBounds = await page.getByTestId(`map-route-node-${locationId}`).boundingBox();
    expect(markerBounds).not.toBeNull();
    expect(nodeBounds).not.toBeNull();
    if (!markerBounds || !nodeBounds) throw new Error(`Route geometry for ${locationId} is unavailable`);
    expect(markerBounds.x + markerBounds.width / 2).toBeCloseTo(nodeBounds.x + nodeBounds.width / 2, 0);
    expect(markerBounds.y + markerBounds.height / 2).toBeCloseTo(nodeBounds.y + nodeBounds.height / 2, 0);
  };

  // At the fitted default view every route stop label sits inside the canvas.
  const canvasBounds = await canvas.boundingBox();
  expect(canvasBounds).not.toBeNull();
  if (!canvasBounds) throw new Error("Map canvas bounds are unavailable");
  const labelCount = await labels.count();
  expect(labelCount).toBeGreaterThan(0);
  for (let index = 0; index < labelCount; index += 1) {
    const labelBounds = await labels.nth(index).boundingBox();
    expect(labelBounds).not.toBeNull();
    if (!labelBounds) throw new Error(`Route label ${index} bounds are unavailable`);
    expect(labelBounds.x).toBeGreaterThanOrEqual(canvasBounds.x - 1);
    expect(labelBounds.x + labelBounds.width).toBeLessThanOrEqual(canvasBounds.x + canvasBounds.width + 1);
    expect(labelBounds.y).toBeGreaterThanOrEqual(canvasBounds.y - 1);
    expect(labelBounds.y + labelBounds.height).toBeLessThanOrEqual(canvasBounds.y + canvasBounds.height + 1);
  }

  await assertMarkerTracksRoute("PAR-002");
  await page.getByRole("button", { name: "Zoom in map" }).click();
  await page.waitForTimeout(180);
  await assertMarkerTracksRoute("PAR-002");
});

test("zero-pound hold routes remain explicit instead of falling back to capacity", async ({ page }) => {
  await page.goto("/plans/PLN-104");
  await page.locator(".plan-card").filter({ hasText: "Hold for Later" }).getByRole("button", { name: "Select plan" }).click();
  await page.goto("/map?plan=PLN-104");

  const warehouseRow = page.getByTestId("map-location-WH-001");
  await expect(warehouseRow).toContainText("0 lb");
  await expect(warehouseRow).toContainText("outbound load");
  await expect(warehouseRow).not.toContainText("cold headroom");
  await expect(page.getByTestId("map-hold-notice")).toContainText("holds inventory on site");
});
