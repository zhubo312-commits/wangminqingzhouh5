import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const outputDir = path.resolve(process.cwd(), "docs/previews");
const viewports = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/paipan/dunjia`);
    await page.getByRole("heading", { name: "起盘时间" }).waitFor();
    const formOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (formOverflow) throw new Error(`${viewport.width}px Dunjia form has horizontal overflow`);
    await page.screenshot({
      path: path.join(outputDir, `dunjia-form-${viewport.width}.png`),
      fullPage: true,
    });

    await page.getByRole("button", { name: "开始排盘" }).click();
    await page.waitForURL("**/paipan/dunjia/result");
    await page.getByRole("heading", { name: /[阴阳]遁[1-9]局/ }).waitFor();
    await page.locator(".dunjia-palace").filter({ hasText: "艮8" }).click();
    await page.locator("#dunjia-palace-detail").waitFor();
    await page.waitForTimeout(250);
    const resultOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (resultOverflow) throw new Error(`${viewport.width}px Dunjia result has horizontal overflow`);
    await page.screenshot({
      path: path.join(outputDir, `dunjia-result-${viewport.width}.png`),
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
