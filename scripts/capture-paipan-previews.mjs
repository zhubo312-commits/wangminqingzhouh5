import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const outputDir = path.resolve(process.cwd(), "docs");
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/paipan/shengping-zishi`);
  await page.getByRole("combobox", { name: /地区/ }).waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const element = document.querySelector(".icon-field select");
    return element instanceof HTMLSelectElement && !element.disabled;
  });
  await page.screenshot({ path: path.join(outputDir, "paipan-form-390.png"), fullPage: true });

  await page.getByRole("button", { name: "开始排盘" }).click();
  await page.waitForURL("**/paipan/shengping-zishi/result");
  await page.getByRole("heading", { name: /四柱命盘/ }).waitFor();
  await page.getByRole("button", { name: "甲寅" }).waitFor();
  await page.screenshot({ path: path.join(outputDir, "paipan-result-390.png"), fullPage: true });
  await context.close();
} finally {
  await browser.close();
}
