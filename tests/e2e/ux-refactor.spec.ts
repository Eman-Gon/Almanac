import { expect, test } from "@playwright/test";

test("decision-critical screens use progressive disclosure and contextual navigation", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Operations Control Tower" })).toBeVisible();
  await expect(page.locator(".urgent-offer-card").getByRole("link", { name: "Review donation" })).toBeVisible();
  await expect(page.locator(".refactor-kpi-card")).toHaveCount(3);
  await expect(page.getByTestId("network-map-canvas")).toHaveCount(0);
  await expect(page.getByText("Simulated demo data", { exact: true })).toBeVisible();
  const briefing = page.locator("details").filter({ hasText: "View full briefing" });
  await expect(briefing).not.toHaveAttribute("open");
});

test("donation and plan details stay hidden until requested", async ({ page }) => {
  await page.goto("/donations/DON-104");
  await expect(page.locator("header").getByRole("link", { name: "Back to Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Confirmed donation facts" })).toBeVisible();
  await expect(page.getByText("Supporting operational details", { exact: true })).toBeVisible();
  await expect(page.getByText("Extraction method", { exact: true })).toBeHidden();

  await page.getByRole("button", { name: "Edit fields" }).click();
  await expect(page.getByRole("dialog", { name: "Edit confirmed fields" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.goto("/plans/PLN-104");
  await page.locator(".plan-card").filter({ hasText: "Warehouse First" }).getByRole("button", { name: "Select plan" }).click();
  await expect(page.getByRole("button", { name: "Review and approve" })).toBeDisabled();
  await page.locator(".plan-card").filter({ hasText: "Mixed Plan" }).getByRole("button", { name: "Select plan" }).click();
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Allocations" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Comparison" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Assumptions" })).toBeVisible();
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Allocations" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Allocations" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /allocations/i })).toBeVisible();

  await page.goto("/donations/DON-104");
  await page.goto("/plans/PLN-104");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Donation details" })).toBeVisible();
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
