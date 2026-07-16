import { expect, test } from "@playwright/test";

test("primary strawberry flow reaches recovered impact", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Reset scenario" }).click();

  await page.getByRole("link", { name: "Open donation" }).click();
  await expect(page.getByText("Hi, Market Street Grocery has about 80 cases")).toBeVisible();
  await page.getByRole("button", { name: "Generate plans" }).click();

  await expect(page.getByRole("heading", { name: "AI Decision Room" })).toBeVisible();
  await expect(page.getByText("Exceeds refrigerated capacity by 780 lb.")).toBeVisible();

  await page.getByRole("button", { name: "Edit quantities" }).click();
  await page.getByRole("spinbutton", { name: "Harbor Light Pantry lb" }).fill("440");
  await page.getByRole("spinbutton", { name: "Eastside Community Pantry lb" }).fill("300");
  await page.getByLabel("Reason for change").fill("Shift 20 lb to the earlier receiving window.");
  await page.getByRole("button", { name: "Apply changes" }).click();

  await page.getByRole("button", { name: "Review & approve" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Approve & create mission" }).click();

  await expect(page.getByRole("heading", { name: "Packing & Cross-Dock Plan" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "440 lb" })).toBeVisible();
  await page.getByRole("button", { name: "Start packing" }).click();
  const firstBatch = page.getByRole("checkbox", { name: "Mark Harbor Light Pantry batch complete" });
  await firstBatch.check();
  await page.reload();
  await expect(firstBatch).toBeChecked();

  await page.getByRole("button", { name: "Open mission" }).click();
  await expect(page.getByText("Drop off 440 lb")).toBeVisible();
  await page.getByRole("link", { name: "Trigger disruption" }).click();
  await page.getByRole("button", { name: "Partner canceled" }).click();
  await expect(page.getByText("300 lb and one route stop affected")).toBeVisible();
  await expect(page.getByText("Storage 60/420 lb · staging 460/500 lb · vehicle 1200/1400 lb.")).toBeVisible();

  await page.goto("/partners/PAR-002");
  await expect(page.getByText("Partner canceled for this mission")).toBeVisible();
  await expect(page.getByText("canceled", { exact: true }).first()).toBeVisible();
  await page.goto("/missions/MSN-104");
  await expect(page.getByText("Canceled · 300 lb requires recovery")).toBeVisible();
  await page.getByRole("link", { name: "Review recovery" }).click();
  await page.getByRole("button", { name: "Approve recovery" }).click();

  await expect(page.getByText("Recovery approved.")).toBeVisible();
  await expect(page.getByText("assigned", { exact: true })).toBeVisible();
  await page.goto("/missions/MSN-104");
  await expect(page.getByText("superseded", { exact: true })).toBeVisible();
  await page.goto("/missions/MSN-105");
  await page.getByRole("link", { name: "View recovery packing plan" }).click();
  await expect(page.getByRole("checkbox", { name: "Mark Harbor Light Pantry batch complete" })).toBeChecked();
  await expect(page.getByRole("row", { name: /Eastside Community Pantry/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Open mission" }).click();
  await page.getByRole("link", { name: "View impact" }).first().click();
  await expect(page.getByText("94%")).toBeVisible();
  await expect(page.getByText("380")).toBeVisible();

  await page.goto("/donations/DON-104");
  await expect(page.getByText("Recovery approved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open plans" }).click();
  await page.getByRole("link", { name: "Missions" }).click();
  await expect(page.getByText("MSN-105 · Recovery route")).toBeVisible();

  await page.getByRole("button", { name: "Reset scenario" }).click();
  await expect(page.getByText("Urgent donation offer")).toBeVisible();
  await expect(page.getByText("Recovery approved.")).not.toBeVisible();
});
