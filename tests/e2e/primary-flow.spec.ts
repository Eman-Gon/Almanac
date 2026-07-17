import { expect, test } from "@playwright/test";

test("primary strawberry flow reaches recovered impact", async ({ page }) => {
  await page.goto("/dashboard");
  const initialReset = page.getByRole("button", { name: "Reset scenario" });
  if (!(await initialReset.isVisible())) {
    await page.getByText("Demo controls", { exact: true }).click();
  }
  await initialReset.click();

  await page.locator(".urgent-offer-card").getByRole("link", { name: "Review inventory lot" }).click();
  await expect(page.getByRole("heading", { name: "Inventory lot detail" })).toBeVisible();
  await expect(page.getByText("Historical agency acceptance", { exact: true })).toBeVisible();
  await expect(page.getByText("No donor pickup is part of this workflow.")).toBeVisible();
  await page.getByRole("button", { name: "Generate outbound plans" }).click();

  await expect(page.getByRole("heading", { name: "Plan comparison" })).toBeVisible();
  await expect(page.getByText("Exceeds refrigerated capacity by 780 lb.")).toBeVisible();

  await page.getByRole("button", { name: "Edit quantities" }).click();
  await page.getByRole("spinbutton", { name: "Harbor Light Pantry lb" }).fill("440");
  await page.getByRole("spinbutton", { name: "Eastside Community Pantry lb" }).fill("300");
  await page.getByLabel("Reason for change").fill("Shift 20 lb to the earlier receiving window.");
  await page.getByRole("button", { name: "Apply changes" }).click();

  await page.getByRole("button", { name: "Review and approve" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Approve & create outbound mission" }).click();

  await expect(page.getByRole("heading", { name: "Packing plan" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "440 lb" })).toBeVisible();
  await page.getByRole("button", { name: "Start packing" }).click();
  const firstBatch = page.getByRole("checkbox", { name: "Mark Harbor Light Pantry batch complete" });
  await firstBatch.check();
  await page.reload();
  await expect(firstBatch).toBeChecked();

  await page.getByRole("button", { name: "Continue to mission" }).click();
  await expect(page.getByText("Drop off 440 lb")).toBeVisible();
  await page.getByRole("link", { name: "Report disruption" }).click();
  await page.getByRole("button", { name: "Run disruption scenario" }).click();
  await expect(page.getByText("300 lb affected · one receiving stop removed")).toBeVisible();
  await expect(page.getByText("No capacity violations")).toBeVisible();

  await page.goto("/map?mission=MSN-104&returnTo=/simulate");
  await expect(page.getByTestId("map-route-layer")).toHaveAttribute("data-route-status", "disrupted");
  await expect(page.getByText("Replanning required", { exact: true }).first()).toBeVisible();
  await page.getByTestId("map-marker-PAR-002").click();
  await expect(page.locator('[aria-label="Eastside Community Pantry operational details"]')).toContainText("Canceled during replanning");
  await page.getByText("Partner capacity, demand, and receiving windows", { exact: true }).click();
  const canceledEastsideRow = page.getByRole("row").filter({ hasText: "Eastside Community Pantry" });
  await expect(canceledEastsideRow.getByText("Canceled stop", { exact: true })).toBeVisible();
  await expect(canceledEastsideRow.getByText("On route", { exact: true })).toHaveCount(0);

  await page.goto("/partners/PAR-002");
  await expect(page.getByText("Partner canceled for this mission")).toBeVisible();
  await expect(page.getByText("canceled", { exact: true }).first()).toBeVisible();
  await page.goto("/missions/MSN-104");
  await expect(page.getByText("Canceled · 300 lb requires recovery")).toBeVisible();
  await page.getByRole("link", { name: "Review recovery" }).click();
  await page.getByRole("button", { name: "Approve recovery plan" }).click();

  await expect(page.getByText("Recovery approved.")).toBeVisible();
  await expect(page.locator('section[aria-label="Mission summary"]').getByText("assigned", { exact: true })).toBeVisible();
  await page.goto("/missions/MSN-104");
  await expect(page.locator('section[aria-label="Mission summary"]').getByText("superseded", { exact: true })).toBeVisible();
  await page.goto("/map?mission=MSN-104");
  await expect(page.getByTestId("map-route-layer")).toHaveAttribute("data-route-status", "superseded");
  await expect(page.getByText("Superseded route", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Original route superseded by the human-approved replacement mission.")).toBeVisible();
  await expect(page.getByText("Human-approved route currently in execution.")).toHaveCount(0);
  await page.goto("/map?mission=MSN-105");
  const recoveredRouteRows = page.locator(".map-location-section").first().locator('[data-testid^="map-location-"]');
  await expect(recoveredRouteRows).toHaveCount(4);
  expect(await recoveredRouteRows.evaluateAll((rows) => rows.map((row) => row.getAttribute("data-testid")))).toEqual([
    "map-location-WH-001",
    "map-location-PAR-001",
    "map-location-PAR-004",
    "map-location-PAR-003",
  ]);
  await page.goto("/map?plan=PLN-104&returnTo=/plans/PLN-104");
  await expect(page.getByText("Balanced Release · Approved", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Recovery route", { exact: true })).toHaveCount(0);
  await page.goto("/missions/MSN-105");
  await page.locator('a[href="/packing/PKG-105"]').first().click();
  await expect(page.getByRole("checkbox", { name: "Mark Harbor Light Pantry batch complete" })).toBeChecked();
  await expect(page.getByRole("row", { name: /Eastside Community Pantry/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Continue to mission|Create mission/ }).click();
  await page.getByRole("link", { name: "View impact" }).first().click();
  await expect(page.getByText("94%")).toBeVisible();
  await expect(page.getByText("380")).toBeVisible();

  await page.goto("/inventory/LOT-104");
  await expect(page.getByText("Recovery approved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open outbound plans" }).click();
  await page.getByRole("link", { name: "Missions" }).click();
  await expect(page.getByText("Recovery route").first()).toBeVisible();

  const finalReset = page.getByRole("button", { name: "Reset scenario" });
  if (!(await finalReset.isVisible())) {
    await page.getByText("Demo controls", { exact: true }).click();
  }
  await finalReset.click();
  await expect(page.getByText("At-risk inventory", { exact: true })).toBeVisible();
  await expect(page.getByText("Recovery approved.")).not.toBeVisible();
});
