import { expect, test } from "@playwright/test";

test("seeded routes and invalid record states are intentional", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Reset scenario" }).click();

  await expect(page.locator('a[href="/missions/MSN-104"]', { hasText: "MSN-1023" })).toHaveCount(0);

  await page.goto("/plans/PLN-104");
  await page.getByRole("button", { name: "Review plan" }).first().click();
  await expect(page.locator('a[href="/partners/WH-001"]')).toHaveCount(0);

  await page.goto("/partners/PAR-001");
  await expect(page.getByRole("heading", { name: "Harbor Light Pantry" })).toBeVisible();

  await page.goto("/map");
  const routesLayer = page.getByRole("checkbox", { name: "Routes" });
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);
  await routesLayer.uncheck();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(0);
  await routesLayer.check();
  await expect(page.getByTestId("map-route-layer")).toHaveCount(1);

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
