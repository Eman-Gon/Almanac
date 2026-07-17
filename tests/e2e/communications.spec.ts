import { expect, test } from "@playwright/test";

test("communication center requires confirmation and shows a safe Vapi preview", async ({ page }) => {
  await page.route("**/api/communications/test", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          mode: "preview",
          channel: "voice",
          provider: "vapi",
          status: "preview_only",
          communicationId: null,
          toMasked: "+14••••0123",
          messagePreview: "Approved test update.",
          voicemailPreview: "Approved test voicemail.",
          note: "No message was sent.",
        },
        error: null,
        meta: { requestId: "e2e-communication", generatedAt: "2026-07-16T12:00:00-07:00", demoMode: true },
      }),
    });
  });

  await page.goto("/communications");
  await expect(page.getByRole("heading", { name: "Partner Communications" })).toBeVisible();
  await expect(page.getByText("Human-approved communication only")).toBeVisible();

  await page.getByLabel("Test number (E.164)").fill("+14155550123");
  await page.getByRole("button", { name: "Place test call" }).click();
  await expect(page.locator(".communication-form .form-error")).toContainText("Confirm that you are authorized");

  await page.getByLabel("I am authorized to contact this test number and approve this exact message.").check();
  await page.getByRole("button", { name: "Place test call" }).click();

  await expect(page.getByText("Preview only — nothing sent")).toBeVisible();
  await expect(page.getByText("No message was sent.")).toBeVisible();
});
