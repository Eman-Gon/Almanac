import { expect, test } from "@playwright/test";

test("multi-item warehouse scenario stays isolated from the strawberry workflow", async ({ page }) => {
  await page.goto("/dashboard");
  const reset = page.getByRole("button", { name: "Reset scenario" });
  if (!(await reset.isVisible())) {
    await page.getByText("Demo controls", { exact: true }).click();
  }
  await reset.click();

  await expect(page.getByRole("heading", { name: "Strawberries" })).toBeVisible();
  await expect(page.getByText("1,200 lb", { exact: false }).first()).toBeVisible();
  const storedHeroState = await page.evaluate(() =>
    window.localStorage.getItem("choicegrid-demo-v3"),
  );

  const selector = page.getByTestId("scenario-selector");
  if (!(await selector.isVisible())) {
    await page.getByText("Demo controls", { exact: true }).click();
  }
  await selector.click();
  await page.getByRole("link", { name: /Multi-item Warehouse Day/ }).click();

  await expect(page).toHaveURL("/inventory/preview");
  await expect(
    page.getByRole("heading", { name: "Multi-item Warehouse Day" }),
  ).toBeVisible();
  await expect(
    page.getByText("Interactive secondary scenario · 0 operational changes"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Blueberries/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Cabbage/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Frozen chicken/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Peanut butter/ })).toBeVisible();

  await page.getByRole("button", { name: /Frozen chicken/ }).click();
  await expect(page.getByText("Staff check required")).toBeVisible();
  await expect(
    page.getByText("Staff confirmation is required before release planning"),
  ).toBeVisible();

  const approve = page.getByRole("button", {
    name: "Approve coordinated preview",
  });
  await expect(approve).toBeDisabled();
  await page.getByRole("checkbox", {
    name: /I reviewed all four lot totals/,
  }).check();
  await approve.click();

  await expect(page.getByRole("status")).toContainText(
    "4 grouped outreach drafts generated",
  );
  await expect(
    page.getByText("Synthetic draft · not sent · no commitment recorded"),
  ).toHaveCount(4);
  await expect(
    page.locator('main a[href^="/plans"], main a[href^="/packing"], main a[href^="/missions"]'),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => window.localStorage.getItem("choicegrid-demo-v3")),
  ).toBe(storedHeroState);

  await page.reload();
  await page.getByText("Demo controls", { exact: true }).click();
  await expect(page.getByTestId("scenario-selector")).toContainText(
    "Multi-item Warehouse Day",
  );
  expect(
    await page.evaluate(() => window.localStorage.getItem("choicegrid-demo-v3")),
  ).toBe(storedHeroState);

  await page.getByRole("link", {
    name: /Return to Strawberry Inventory Release/,
  }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Strawberries" })).toBeVisible();
});

test("multi-item warehouse scenario remains usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inventory/preview");

  await expect(
    page.getByRole("heading", { name: "Multi-item Warehouse Day" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Four products. One coordinated release preview.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Frozen chicken/ }).click();
  await expect(page.getByText("Staff check required")).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  await page.getByRole("checkbox", {
    name: /I reviewed all four lot totals/,
  }).check();
  await page.getByRole("button", {
    name: "Approve coordinated preview",
  }).click();
  await expect(page.getByRole("status")).toContainText(
    "4 grouped outreach drafts generated",
  );
});
