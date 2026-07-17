import { expect, test } from "@playwright/test";

test("demo scenario control allows preview selection without changing the seeded fixture", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByText("Demo controls", { exact: true }).click();

  const selector = page.getByTestId("scenario-selector");
  await expect(selector).toContainText("Strawberry Inventory Release");
  await selector.click();

  await expect(page.getByText("Executable MVP scenario")).toBeVisible();
  await expect(page.getByRole("link", { name: /Multi-item Warehouse Day/ })).toBeVisible();
  await expect(page.getByText("Strawberry Inventory Release remains the judged executable fixture. The multi-item route never changes its state.")).toBeVisible();

  const truckBreakdown = page.getByRole("button", { name: /Truck breakdown/ });
  await expect(truckBreakdown).toBeEnabled();
  await truckBreakdown.click();
  await expect(selector).toContainText("Truck breakdown");
  await expect(truckBreakdown).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
});
