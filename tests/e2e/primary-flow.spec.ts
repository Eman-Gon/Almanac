import { expect, test } from "@playwright/test";

test("primary strawberry flow reaches recovered impact", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Reset scenario" }).click();

  await page.getByRole("link", { name: "Open donation" }).click();
  await expect(page.getByText("Hi, Market Street Grocery has about 80 cases")).toBeVisible();
  await page.getByRole("button", { name: "Generate plans" }).click();

  await expect(page.getByRole("heading", { name: "AI Decision Room" })).toBeVisible();
  await expect(page.getByText("Exceeds refrigerated capacity by 780 lb.")).toBeVisible();
  await page.getByRole("button", { name: "Review & approve" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Approve & create mission" }).click();

  await expect(page.getByRole("heading", { name: "Packing & Cross-Dock Plan" })).toBeVisible();
  await page.getByRole("button", { name: "Open mission" }).click();
  await page.getByRole("link", { name: "Trigger disruption" }).click();
  await page.getByRole("button", { name: "Pantry canceled" }).click();
  await expect(page.getByText("320 lb and one route stop affected")).toBeVisible();
  await page.getByRole("button", { name: "Approve recovery" }).click();

  await expect(page.getByText("Recovery approved.")).toBeVisible();
  await page.getByRole("link", { name: "View impact" }).first().click();
  await expect(page.getByText("94%")).toBeVisible();
  await expect(page.getByText("380")).toBeVisible();
});
