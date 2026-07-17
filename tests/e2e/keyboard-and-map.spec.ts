import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator, limit = 80) {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Keyboard focus did not reach ${await target.textContent()}`);
}

test("keyboard-only traversal reaches the approval dialog and restores focus", async ({ page }) => {
  await page.goto("/dashboard");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const inventory = page.getByRole("link", { name: "Review inventory lot" });
  await tabTo(page, inventory);
  await page.keyboard.press("Enter");

  const generate = page.getByRole("button", { name: "Generate outbound plans" });
  await tabTo(page, generate);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Plan comparison" })).toBeVisible();

  const holdSelect = page.locator(".plan-card").filter({ hasText: "Hold for Later" }).getByRole("button", { name: "Select plan" });
  const fastestSelect = page.locator(".plan-card").filter({ hasText: "Fastest Agency Release" }).getByRole("button", { name: "Select plan" });
  await tabTo(page, holdSelect);
  await expect(holdSelect).toBeFocused();
  await tabTo(page, fastestSelect, 6);
  await expect(fastestSelect).toBeFocused();

  const review = page.getByRole("button", { name: "Review and approve" });
  await tabTo(page, review);
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close approval dialog" })).toBeFocused();
  const confirmation = page.getByRole("checkbox");
  await tabTo(page, confirmation, 10);
  await page.keyboard.press("Space");
  await expect(confirmation).toBeChecked();
  const approve = page.getByRole("button", { name: "Approve & create outbound mission" });
  await tabTo(page, approve, 5);
  await expect(approve).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(review).toBeFocused();
});

test("map marker, layer, and accessible list state stay synchronized", async ({ page }) => {
  await page.goto("/map");

  const harborMarker = page.getByTestId("map-marker-PAR-001");
  const harborList = page.getByTestId("map-location-PAR-001");
  await harborList.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close location details" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(harborList).toBeFocused();

  await harborMarker.click();
  await expect(harborMarker).toHaveAttribute("aria-pressed", "true");
  await expect(harborList).toHaveAttribute("aria-pressed", "true");

  const eastsideList = page.getByTestId("map-location-PAR-002");
  await eastsideList.click();
  await expect(eastsideList).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("map-marker-PAR-002")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("map-location-PAR-001")).toContainText("420 lb");
  await expect(page.getByTestId("map-location-PAR-001")).toContainText("planned delivery");

  const routes = page.getByRole("checkbox", { name: "Routes" });
  await routes.uncheck();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(0);
  await expect(page.getByText(/Routes layer hidden/)).toBeVisible();

  const demand = page.getByRole("checkbox", { name: "Demand partners" });
  await demand.uncheck();
  await expect(page.getByTestId("map-marker-PAR-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-PAR-001")).toHaveCount(0);
  await demand.check();
  await expect(page.getByTestId("map-marker-PAR-002")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[aria-label="Eastside Community Pantry operational details"]')).toHaveCount(0);

  const capacity = page.getByRole("checkbox", { name: "Warehouse capacity" });
  await capacity.uncheck();
  await expect(page.getByTestId("map-marker-WH-001")).toHaveCount(0);
  await expect(page.getByTestId("map-location-WH-001")).toHaveCount(0);

  const vehicles = page.getByRole("checkbox", { name: "Vehicles" });
  await expect(page.getByTestId("map-marker-FLEET")).toBeVisible();
  await vehicles.uncheck();
  await expect(page.getByTestId("map-marker-FLEET")).toHaveCount(0);
});
