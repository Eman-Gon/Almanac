import { expect, test } from "@playwright/test";

test("demo scenario control exposes the active fixture and honest previews", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByText("Demo controls", { exact: true }).click();

  const selector = page.getByTestId("scenario-selector");
  await expect(selector).toContainText("Strawberry Inventory Release");
  await selector.click();

  await expect(page.getByText("Executable MVP scenario")).toBeVisible();
  await expect(page.getByText("Only Strawberry Inventory Release changes the demo state today.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Truck breakdown/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Cold capacity lost/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Driver unavailable/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Agency receiving window shortened/ })).toBeDisabled();
});
