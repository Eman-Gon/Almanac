import { expect, test } from "@playwright/test";

test("seeded routes and invalid record states are intentional", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/dashboard");
  const resetScenario = page.getByRole("button", { name: "Reset scenario" });
  if (!(await resetScenario.isVisible())) {
    await page.getByText("Demo controls", { exact: true }).click();
  }
  await resetScenario.click();

  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "At-risk inventory" })).toBeVisible();
  await expect(page.getByText(/LOT-103 · South County Distribution Center/)).toBeVisible();
  await expect(page.getByText("Mock history · display only")).toBeVisible();
  await page.locator('a[href="/inventory/LOT-104"]').filter({ hasText: "Strawberries" }).click();
  await expect(page.getByRole("heading", { name: "Confirmed inventory facts" })).toBeVisible();
  await expect(page.getByText("Historical agency acceptance", { exact: true })).toBeVisible();

  await expect(page.locator('a[href="/missions/MSN-104"]', { hasText: "MSN-1023" })).toHaveCount(0);

  await page.goto("/plans/PLN-104");
  await page.locator(".plan-card").filter({ hasText: "Hold for Later" }).getByRole("button", { name: "Select plan" }).click();
  await expect(page.locator('a[href="/partners/WH-001"]')).toHaveCount(0);
  await page.locator(".plan-card").filter({ hasText: "Balanced Release" }).getByRole("button", { name: "Select plan" }).click();

  await page.goto("/partners/PAR-001");
  await expect(page.getByRole("heading", { name: "Harbor Light Pantry" })).toBeVisible();
  await expect(page.getByText("9:30 AM – 12:00 PM", { exact: true })).toBeVisible();

  await page.goto("/partners/PAR-002");
  await expect(page.getByRole("heading", { name: "Eastside Community Pantry" })).toBeVisible();
  await expect(page.getByText("10:00 AM – 12:30 PM", { exact: true })).toBeVisible();

  await page.goto("/partners/PAR-004");
  await expect(page.getByRole("heading", { name: "Northside Family Resource Center" })).toBeVisible();
  await expect(page.getByText("9:30 AM – 2:00 PM", { exact: true })).toBeVisible();

  await page.goto("/map");
  const routesLayer = page.getByRole("checkbox", { name: "Routes" });
  const demandLayer = page.getByRole("checkbox", { name: "Demand partners" });
  const capacityLayer = page.getByRole("checkbox", { name: "Warehouse capacity" });
  const vehiclesLayer = page.getByRole("checkbox", { name: "Vehicles" });
  const routeStopLabels = [
    ["PAR-001", "Harbor Light Pantry"],
    ["PAR-002", "Eastside Community Pantry"],
    ["PAR-003", "Community Kitchen"],
  ] as const;

  await expect(page.locator('[aria-label$=" operational details"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Zoom in map" })).toBeVisible();
  const baseZoomText = await page.getByTestId("map-zoom-status").innerText();
  expect(baseZoomText).toMatch(/^Z\d+$/);
  const baseZoom = Number(baseZoomText.slice(1));
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);
  await expect(page.getByTestId("map-route-layer")).toHaveAttribute("data-route-status", "candidate");
  await expect(page.getByTestId("map-marker-DNR-001")).toHaveCount(0);
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(1);
  await expect(page.getByTestId("map-location-PAR-001")).toHaveCount(1);
  await expect(page.getByTestId("map-location-PAR-004")).toHaveCount(0);
  for (const [id, name] of routeStopLabels) {
    await expect(page.getByTestId(`map-route-label-${id}`)).toContainText(name);
  }
  await expect(page.getByTestId("map-route-label-PAR-004")).toHaveCount(0);

  const canvas = page.getByTestId("network-map-canvas");
  const canvasBounds = await canvas.boundingBox();
  expect(canvasBounds).not.toBeNull();
  if (!canvasBounds) throw new Error("Map canvas bounds are unavailable");
  await page.mouse.move(canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + canvasBounds.height / 2);
  await page.mouse.wheel(0, -600);
  await expect(page.getByTestId("map-zoom-status")).toHaveText(`Z${baseZoom + 1}`);
  await page.waitForTimeout(150);
  await page.mouse.wheel(0, 600);
  await expect(page.getByTestId("map-zoom-status")).toHaveText(`Z${baseZoom}`);

  const routeGeometry = await page.getByTestId("map-route-layer").getAttribute("d");
  expect(routeGeometry).toBeTruthy();
  await page.getByRole("button", { name: "Zoom in map" }).click();
  await expect(page.getByTestId("map-zoom-status")).toHaveText(`Z${baseZoom + 1}`);
  // Geographic projection recalculates path coordinates on zoom; presence must remain.
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset map view" }).click();
  await expect(page.getByTestId("map-zoom-status")).toHaveText(`Z${baseZoom}`);
  await canvas.focus();
  await page.keyboard.press("=");
  await expect(page.getByTestId("map-zoom-status")).toHaveText(`Z${baseZoom + 1}`);
  const viewportTransformBeforePan = await page.getByTestId("map-viewport").getAttribute("style");
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => page.getByTestId("map-viewport").getAttribute("style")).not.toBe(viewportTransformBeforePan);
  const viewportTransformBeforeDrag = await page.getByTestId("map-viewport").getAttribute("style");
  const dragStartX = canvasBounds.x + canvasBounds.width / 2;
  const dragStartY = canvasBounds.y + canvasBounds.height / 2;
  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  await page.mouse.move(dragStartX + 100, dragStartY - 70, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => page.getByTestId("map-viewport").getAttribute("style")).not.toBe(viewportTransformBeforeDrag);
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);
  await page.keyboard.press("0");
  await expect(page.getByTestId("map-zoom-status")).toHaveText(`Z${baseZoom}`);

  await page.getByTestId("map-marker-PAR-001").click();
  const harborDetails = page.locator('[aria-label="Harbor Light Pantry operational details"]');
  await expect(harborDetails).toBeVisible();
  await expect(harborDetails).toContainText("Planned delivery");
  await expect(harborDetails).toContainText("420 lb · Refrigerated");
  await expect(harborDetails).toContainText("Documented demand");
  await expect(harborDetails).toContainText("520 lb · Critical");
  await expect(harborDetails).toContainText("500 lb");
  await expect(harborDetails).toContainText("Compatible cold capacity");
  await page.keyboard.press("Escape");
  await expect(harborDetails).toHaveCount(0);
  await expect(page.getByTestId("map-marker-PAR-001")).toBeFocused();

  await page.getByRole("button", { name: /Other agencies/ }).click();
  await page.getByTestId("map-location-PAR-004").click();
  await expect(page.locator('[aria-label="Northside Family Resource Center operational details"]')).toBeVisible();
  await expect(page.getByTestId("map-marker-PAR-004")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close location details" }).click();

  await demandLayer.uncheck();
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-PAR-001")).toHaveCount(0);
  await demandLayer.check();
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(1);

  await capacityLayer.uncheck();
  await expect(page.getByTestId("map-marker-WH-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-WH-001")).toHaveCount(0);
  await capacityLayer.check();
  await expect(page.getByTestId("map-marker-WH-001")).toHaveCount(1);

  await expect(page.getByTestId("map-marker-FLEET")).toBeVisible();
  await vehiclesLayer.uncheck();
  await expect(page.getByTestId("map-marker-FLEET")).toHaveCount(0);
  await vehiclesLayer.check();
  await expect(page.getByTestId("map-marker-FLEET")).toHaveCount(1);

  await routesLayer.uncheck();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(0);
  await expect(page.getByTestId("map-route-label-PAR-001")).toHaveCount(0);
  await expect(page.getByText("Routes layer hidden")).toBeVisible();
  await routesLayer.check();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("map-marker-PAR-001")).toBeVisible();
  await expect(page.getByTestId("map-location-PAR-001")).toContainText("Harbor Light Pantry");
  await page.getByTestId("map-marker-PAR-001").click();
  await expect(page.locator('[aria-label="Harbor Light Pantry operational details"]')).toContainText("420 lb · Refrigerated");
  await page.getByRole("button", { name: "Close location details" }).click();

  await page.goto("/map?mission=MSN-105");
  await expect(page.getByText("Replacement mission not created")).toBeVisible();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(0);

  await page.goto("/missions/MSN-105");
  await expect(page.getByText("The replacement mission has not been created yet.")).toBeVisible();

  for (const path of [
    "/inventory/UNKNOWN",
    "/plans/UNKNOWN",
    "/packing/UNKNOWN",
    "/missions/UNKNOWN",
    "/partners/UNKNOWN",
    "/map?plan=UNKNOWN",
    "/map?mission=UNKNOWN",
  ]) {
    await page.goto(path);
    await expect(page.getByText("That Almanac record was not found.")).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
});

test("legacy donation intake stays isolated from the warehouse hero", async ({ page }) => {
  await page.route("**/api/donations/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          fallbackUsed: false,
          execution: {
            source: "backup_model",
            provider: "venice",
            model: "minimax-m25",
            attemptedModels: [
              "openai-gpt-4o-mini-2024-07-18",
              "minimax-m25",
            ],
          },
        },
        error: null,
        meta: {
          requestId: "e2e-intake",
          generatedAt: "2026-07-16T10:00:00-07:00",
          demoMode: true,
        },
      }),
    });
  });

  await page.goto("/donations/new");
  await page.getByRole("button", { name: "Load demo offer" }).click();
  await page.getByRole("button", { name: "Parse offer" }).click();

  await expect(page).toHaveURL(/\/donations\/DON-104\?intake=backup_model&model=minimax-m25/);
  await expect(page.getByRole("heading", { name: "Inventory lot detail" })).toBeVisible();
  await expect(page.getByText("No donor pickup is part of this workflow.")).toBeVisible();
  await expect(page.getByText("Ready for deterministic outbound planning")).toBeVisible();
});

test("donation intake saves, restores, and clears a local draft", async ({ page }) => {
  await page.goto("/donations/new");
  await page.getByLabel("Donor", { exact: true }).fill("Synthetic Neighborhood Market");
  await page.getByLabel("Donor message or description").fill("Synthetic draft offer for review.");
  await page.getByLabel("Product").fill("Apples");
  await page.getByLabel("Quantity (lb)").fill("240");
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page.getByRole("status")).toHaveText("Draft saved locally in demo mode.");
  await page.reload();
  await expect(page.getByLabel("Donor", { exact: true })).toHaveValue("Synthetic Neighborhood Market");
  await expect(page.getByLabel("Product")).toHaveValue("Apples");
  await expect(page.getByLabel("Quantity (lb)")).toHaveValue("240");

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByLabel("Donor", { exact: true })).toHaveValue("");
  await page.reload();
  await expect(page.getByLabel("Donor", { exact: true })).toHaveValue("");
  await expect(page.getByRole("status")).toHaveCount(0);
});
