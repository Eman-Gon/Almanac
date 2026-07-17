import { expect, test } from "@playwright/test";

test("decision-critical screens use progressive disclosure and contextual navigation", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Operations Control Tower" })).toBeVisible();
  await expect(page.locator(".urgent-offer-card").getByRole("link", { name: "Review inventory lot" })).toBeVisible();
  await expect(page.locator(".refactor-kpi-card")).toHaveCount(4);
  await expect(page.getByTestId("network-map-canvas")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Map", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Communications", exact: true })).toHaveCount(0);
  await expect(page.getByText("Simulated demo data", { exact: true })).toBeVisible();
  const briefing = page.locator("details").filter({ hasText: "View full briefing" });
  await expect(briefing).not.toHaveAttribute("open");
});

test("inventory and plan details stay hidden until requested", async ({ page }) => {
  await page.goto("/inventory/LOT-104");
  await expect(page.locator("header").getByRole("link", { name: "Back to Inventory" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Confirmed inventory facts" })).toBeVisible();
  await expect(page.getByText("Audit and provenance details", { exact: true })).toBeVisible();
  await expect(page.getByText("Source and current state", { exact: true })).toBeHidden();

  await page.goto("/plans/PLN-104");
  await page.locator(".plan-card").filter({ hasText: "Hold for Later" }).getByRole("button", { name: "Select plan" }).click();
  await expect(page.getByRole("button", { name: "Review and approve" })).toBeDisabled();
  await page.locator(".plan-card").filter({ hasText: "Balanced Release" }).getByRole("button", { name: "Select plan" }).click();
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Allocations" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Comparison" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Assumptions" })).toBeVisible();
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Allocations" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Allocations" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /allocations/i })).toBeVisible();

  await page.goto("/inventory/LOT-104");
  await page.goto("/plans/PLN-104");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Inventory lot detail" })).toBeVisible();
});

test("contextual map preserves its return path and narrow screens do not overflow", async ({ page }) => {
  await page.goto("/map?plan=PLN-104&returnTo=/plans/PLN-104");
  await expect(page.getByRole("link", { name: "Back to Plan" })).toHaveAttribute("href", "/plans/PLN-104");
  await expect(page.getByRole("heading", { name: "Route map" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom in map" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const scrollMetrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(scrollMetrics.scrollWidth).toBeLessThanOrEqual(scrollMetrics.clientWidth + 1);
});
