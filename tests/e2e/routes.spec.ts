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

  await page.goto("/donations");
  await expect(page.getByRole("heading", { name: "Recent offers" })).toBeVisible();
  await expect(page.getByText(/DON-103 · Market Street Grocery/)).toBeVisible();
  await expect(page.getByText("History · display only")).toBeVisible();
  await page.getByRole("link", { name: /Strawberries DON-104 · Market Street Grocery.*1,200 lb.*Ready for planning/ }).click();
  await expect(page.getByRole("heading", { name: "Original donor message" }).first()).toBeVisible();

  await expect(page.locator('a[href="/missions/MSN-104"]', { hasText: "MSN-1023" })).toHaveCount(0);

  await page.goto("/plans/PLN-104");
  await page.locator("article", { has: page.getByRole("heading", { name: "Warehouse First" }) }).getByRole("button", { name: "Select plan" }).click();
  await expect(page.locator('a[href="/partners/WH-001"]')).toHaveCount(0);
  await page.locator("article", { has: page.getByRole("heading", { name: "Mixed Plan" }) }).getByRole("button", { name: "Select plan" }).click();

  await page.goto("/partners/PAR-001");
  await expect(page.getByRole("heading", { name: "Harbor Light Pantry" })).toBeVisible();

  await page.goto("/map");
  const routesLayer = page.getByRole("checkbox", { name: "Routes" });
  const demandLayer = page.getByRole("checkbox", { name: "Demand partners" });
  const capacityLayer = page.getByRole("checkbox", { name: "Warehouse capacity" });
  const vehiclesLayer = page.getByRole("checkbox", { name: "Vehicles" });
  const routeStopLabels = [
    ["DNR-001", "Market Street Grocery"],
    ["WH-001", "South County Distribution Center"],
    ["PAR-001", "Harbor Light Pantry"],
    ["PAR-002", "Eastside Community Pantry"],
    ["PAR-003", "Community Kitchen"],
  ] as const;

  await expect(page.locator('[aria-label$=" operational details"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Zoom in map" })).toBeVisible();
  await expect(page.getByTestId("map-zoom-status")).toHaveText("100%");
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);
  await expect(page.getByTestId("map-route-layer")).toHaveAttribute("data-route-status", "candidate");
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(1);
  await expect(page.getByTestId("map-location-PAR-001")).toHaveCount(1);
  await expect(page.getByTestId("map-location-PAR-004")).toHaveCount(0);
  for (const [id, name] of routeStopLabels) {
    await expect(page.getByTestId(`map-route-label-${id}`)).toContainText(name);
  }
  await expect(page.getByTestId("map-route-label-PAR-004")).toHaveCount(0);

  const routeGeometry = await page.getByTestId("map-route-layer").getAttribute("points");
  await page.getByRole("button", { name: "Zoom in map" }).click();
  await expect(page.getByTestId("map-zoom-status")).toHaveText("125%");
  await expect(page.getByTestId("map-route-layer")).toHaveAttribute("points", routeGeometry ?? "");
  await page.getByRole("button", { name: "Reset map view" }).click();
  await expect(page.getByTestId("map-zoom-status")).toHaveText("100%");
  await page.getByTestId("network-map-canvas").focus();
  await page.keyboard.press("=");
  await expect(page.getByTestId("map-zoom-status")).toHaveText("125%");
  const viewportTransformBeforePan = await page.getByTestId("map-viewport").getAttribute("transform");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("map-viewport")).not.toHaveAttribute("transform", viewportTransformBeforePan ?? "");
  const canvasBounds = await page.getByTestId("network-map-canvas").boundingBox();
  expect(canvasBounds).not.toBeNull();
  const viewportTransformBeforeDrag = await page.getByTestId("map-viewport").getAttribute("transform");
  await page.mouse.move((canvasBounds?.x ?? 0) + (canvasBounds?.width ?? 0) - 70, (canvasBounds?.y ?? 0) + 100);
  await page.mouse.down();
  await page.mouse.move((canvasBounds?.x ?? 0) + (canvasBounds?.width ?? 0) - 110, (canvasBounds?.y ?? 0) + 135);
  await page.mouse.up();
  await expect(page.getByTestId("map-viewport")).not.toHaveAttribute("transform", viewportTransformBeforeDrag ?? "");
  await expect(page.getByTestId("map-route-layer")).toHaveAttribute("points", routeGeometry ?? "");
  await page.keyboard.press("0");
  await expect(page.getByTestId("map-zoom-status")).toHaveText("100%");

  await page.getByTestId("map-marker-PAR-001").click();
  const harborDetails = page.locator('[aria-label="Harbor Light Pantry operational details"]');
  await expect(harborDetails).toBeVisible();
  await expect(harborDetails).toContainText("Planned delivery");
  await expect(harborDetails).toContainText("420 lb · Refrigerated");
  await expect(harborDetails).toContainText("Demand");
  await expect(harborDetails).toContainText("520 lb · Critical");
  await expect(harborDetails).toContainText("500 lb available");
  await expect(harborDetails).toContainText("9:30 AM – 12:00 PM");
  await page.keyboard.press("Escape");
  await expect(harborDetails).toHaveCount(0);
  await expect(page.getByTestId("map-marker-PAR-001")).toBeFocused();

  await page.getByRole("button", { name: "Nearby context · 10" }).click();
  await page.getByTestId("map-location-PAR-004").click();
  await expect(page.locator('[aria-label="Northside Family Resource Center operational details"]')).toBeVisible();
  await expect(page.getByTestId("map-marker-PAR-004")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close location details" }).click();

  await expect(page.getByTestId("map-legend-demand")).toHaveCount(1);
  await demandLayer.uncheck();
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-PAR-001")).toHaveCount(0);
  await expect(page.getByTestId("map-legend-demand")).toHaveCount(0);
  await demandLayer.check();
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(1);
  await expect(page.getByTestId("map-legend-demand")).toHaveCount(1);

  await expect(page.getByTestId("map-legend-capacity")).toHaveCount(1);
  await capacityLayer.uncheck();
  await expect(page.getByTestId("map-marker-WH-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-WH-001")).toHaveCount(0);
  await expect(page.getByTestId("map-legend-capacity")).toHaveCount(0);
  await capacityLayer.check();
  await expect(page.getByTestId("map-marker-WH-001")).toHaveCount(1);

  await expect(page.getByTestId("map-legend-vehicles")).toHaveCount(1);
  await vehiclesLayer.uncheck();
  await expect(page.getByTestId("map-marker-VEH-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-VEH-001")).toHaveCount(0);
  await expect(page.getByTestId("map-legend-vehicles")).toHaveCount(0);
  await vehiclesLayer.check();
  await expect(page.getByTestId("map-marker-VEH-001")).toHaveCount(1);

  await routesLayer.uncheck();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(0);
  await expect(page.getByTestId("map-route-label-PAR-001")).toHaveCount(0);
  await expect(page.getByText("Routes layer hidden · location context remains available.")).toBeVisible();
  await routesLayer.check();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("map-marker-PAR-001").locator(".map-marker-sequence-badge")).toBeVisible();
  await expect(page.getByTestId("map-route-label-PAR-001")).toBeHidden();
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
    "/donations/UNKNOWN",
    "/plans/UNKNOWN",
    "/packing/UNKNOWN",
    "/missions/UNKNOWN",
    "/partners/UNKNOWN",
  ]) {
    await page.goto(path);
    await expect(page.getByText("That ChoiceGrid record was not found.")).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
});

test("donation intake reports when the backup model handled extraction", async ({ page }) => {
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

  await page.getByText("Supporting operational details", { exact: true }).click();
  await expect(page.getByText("Validated backup-model extraction")).toBeVisible();
  await expect(page.getByText("minimax-m25")).toBeVisible();
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
