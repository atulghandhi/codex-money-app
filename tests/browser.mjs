import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.APP_URL || "http://localhost:5173");
  await expect(
    page.getByRole("heading", { name: "Make room for life." }),
  ).toBeVisible();
  await expect(page.locator(".hero-amount")).toContainText("£690");
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Let’s find out" }).click();
  await page
    .getByRole("spinbutton", { name: "Trial purchase amount" })
    .fill("1000");
  await expect(page.getByText("This would stretch your plan.")).toBeVisible();
  await page.getByRole("button", { name: "Close experiment" }).click();
  await page
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "What was it for?", exact: true })
    .fill("Smoke test coffee");
  await page
    .getByRole("spinbutton", { name: "Amount (GBP)", exact: true })
    .fill("5");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".hero-amount")).toContainText("£685");
  await page.reload();
  await expect(page.locator(".hero-amount")).toContainText("£685");
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search transactions" })
    .fill("Smoke test");
  await expect(
    page.getByRole("button", { name: "Edit Smoke test coffee" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Your money", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
  console.log("Browser smoke tests passed. Captures saved to test-results/.");
} finally {
  await browser.close();
}
