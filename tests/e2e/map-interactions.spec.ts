import { expect, test } from "@playwright/test";

test("map supports mouse-wheel zoom, trackpad pan, and pinch zoom", async ({ page }) => {
  await page.goto("/map");

  const canvas = page.getByTestId("network-map-canvas");
  const viewport = page.getByTestId("map-viewport");
  const zoom = page.getByTestId("map-zoom-status");

  await expect(zoom).toHaveText("100%");
  await canvas.hover();
  await page.mouse.wheel(0, -600);
  await expect(zoom).toHaveText("125%");
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, 600);
  await expect(zoom).toHaveText("100%");

  await page.getByRole("button", { name: "Zoom in map" }).click();
  const canvasBounds = await canvas.boundingBox();
  expect(canvasBounds).not.toBeNull();
  await page.mouse.move(
    (canvasBounds?.x ?? 0) + (canvasBounds?.width ?? 0) / 2,
    (canvasBounds?.y ?? 0) + (canvasBounds?.height ?? 0) / 2,
  );

  const beforeTrackpadPan = await viewport.getAttribute("transform");
  await page.mouse.wheel(0, 24);
  await expect(viewport).not.toHaveAttribute("transform", beforeTrackpadPan ?? "");
  await expect(zoom).toHaveText("125%");

  await page.waitForTimeout(100);
  await canvas.evaluate((node, bounds) => {
    node.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: bounds.x + bounds.width / 2,
      clientY: bounds.y + bounds.height / 2,
      ctrlKey: true,
      deltaY: -1,
    }));
  }, {
    x: canvasBounds?.x ?? 0,
    y: canvasBounds?.y ?? 0,
    width: canvasBounds?.width ?? 0,
    height: canvasBounds?.height ?? 0,
  });
  await expect(zoom).toHaveText("150%");

  const beforeMouseDrag = await viewport.getAttribute("transform");
  await page.mouse.down();
  await page.mouse.move(
    (canvasBounds?.x ?? 0) + (canvasBounds?.width ?? 0) / 2 - 100,
    (canvasBounds?.y ?? 0) + (canvasBounds?.height ?? 0) / 2 + 70,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(viewport).not.toHaveAttribute("transform", beforeMouseDrag ?? "");
});

test("route labels stay readable in the stacked map layout", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 652 });
  await page.goto("/map");

  const canvas = page.getByTestId("network-map-canvas");
  const labels = page.locator("[data-testid^=map-route-label-]");
  const assertLabelsFit = async () => {
    const canvasBounds = await canvas.boundingBox();
    expect(canvasBounds).not.toBeNull();
    if (!canvasBounds) {
      throw new Error("Map canvas bounds are unavailable");
    }
    for (let index = 0; index < await labels.count(); index += 1) {
      const labelBounds = await labels.nth(index).boundingBox();
      expect(labelBounds).not.toBeNull();
      if (!labelBounds) {
        throw new Error(`Route label ${index} bounds are unavailable`);
      }
      expect(labelBounds.x).toBeGreaterThanOrEqual(canvasBounds.x - 1);
      expect(labelBounds.x + labelBounds.width).toBeLessThanOrEqual(canvasBounds.x + canvasBounds.width + 1);
      expect(labelBounds.y).toBeGreaterThanOrEqual(canvasBounds.y - 1);
      expect(labelBounds.y + labelBounds.height).toBeLessThanOrEqual(canvasBounds.y + canvasBounds.height + 1);
    }
  };

  await assertLabelsFit();
  await page.getByRole("button", { name: "Zoom in map" }).click();
  await page.waitForTimeout(180);
  await assertLabelsFit();
  await page.getByRole("button", { name: "Zoom in map" }).click();
  await page.getByRole("button", { name: "Zoom in map" }).click();
  await page.waitForTimeout(180);
  await assertLabelsFit();
});
