import { expect, test } from "@playwright/test";

test("hero dashboard remains usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Operations Control Tower" })).toBeVisible();
  await expect(page.getByRole("button", { name: /navigation/i })).toBeVisible();

  const scrollMetrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollMetrics.scrollWidth).toBeLessThanOrEqual(scrollMetrics.clientWidth + 1);
});

test("wide tables expose a swipe affordance on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/plans/PLN-104");
  await page.getByRole("tab", { name: "Allocations" }).click();

  const scrollRegion = page.locator(".table-scroll").first();
  await expect(scrollRegion).toBeVisible();
  const hint = await scrollRegion.evaluate((element) =>
    window.getComputedStyle(element, "::after").getPropertyValue("content"),
  );
  expect(hint.replaceAll('"', "")).toContain("Swipe for more columns");
});
