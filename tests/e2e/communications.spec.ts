import { expect, test } from "@playwright/test";

test("partner outreach stays post-approval, simulated, and operationally inert", async ({ page }) => {
  const communicationRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/communications/")) {
      communicationRequests.push(request.url());
    }
  });

  await page.goto("/communications");
  await expect(
    page.getByRole("heading", { name: "Partner Outreach Simulator" }),
  ).toBeVisible();
  await expect(page.getByText("Plan approval required")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run simulated outreach" }),
  ).toHaveCount(0);

  await page.goto("/inventory/LOT-104");
  await page.getByRole("button", { name: "Generate outbound plans" }).click();
  await page.getByRole("button", { name: "Review and approve" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Approve & create outbound mission" }).click();

  await page.goto("/communications");
  await expect(page.getByText("Simulation only — no calls are placed")).toBeVisible();
  await expect(page.getByText("One approval. 3 simulated partner conversations.")).toBeVisible();
  await expect(page.getByText("Harbor Light Pantry", { exact: true })).toBeVisible();
  await expect(page.getByText("Eastside Community Pantry", { exact: true })).toBeVisible();
  await expect(page.getByText("Community Kitchen", { exact: true })).toBeVisible();

  const beforeState = await page.evaluate(() =>
    window.localStorage.getItem("choicegrid-demo-v3"),
  );

  await page.getByRole("button", { name: "Run simulated outreach" }).click();
  await expect(page.getByRole("alert").filter({
    hasText: "Confirm that you approve this local simulation",
  })).toContainText(
    "Confirm that you approve this local simulation",
  );

  await page.getByRole("checkbox", {
    name: /I approve these exact scripts for a local simulation/,
  }).check();
  await page.getByRole("button", { name: "Run simulated outreach" }).click();

  await expect(page.getByRole("status")).toContainText(
    "3 synthetic responses created",
  );
  await expect(page.getByText("Synthetic acknowledgment")).toHaveCount(3);
  await expect(page.getByText("Unverified · no commitment recorded")).toHaveCount(3);
  await expect(page.getByText("0 operational changes")).toBeVisible();

  const afterState = await page.evaluate(() =>
    window.localStorage.getItem("choicegrid-demo-v3"),
  );
  expect(afterState).toBe(beforeState);
  expect(communicationRequests).toEqual([]);
});
