import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { xingxiangChart, xingxiangRequest } from "./xingxiang-fixture.mjs";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const previewRoot = path.resolve(process.cwd(), "docs/previews");
const viewports = [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 430, height: 932 }];
const paipanRef = `pp_${"x".repeat(32)}`;

async function assertNoOverflow(page, label) {
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`${label} has horizontal overflow`);
}

async function mockResult(page) {
  await page.addInitScript(({ key, value }) => window.sessionStorage.setItem(key, value), { key: "guoxue.paipan.xingxiang_ref.v1", value: paipanRef });
  await page.route("**/api/v1/paipan/xingxiang/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ schemaVersion: "guoxue.paipan.xingxiang.v1", chartType: "xingxiang", paipan_ref: paipanRef, generatedAt: "2026-08-12T00:00:00.000Z", expiresAt: "2027-08-12T12:00:00.000Z", chartRequest: xingxiangRequest, chart: xingxiangChart }),
  }));
}

await mkdir(previewRoot, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const viewport of viewports) {
    const formContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const formPage = await formContext.newPage();
    await formPage.goto(`${baseUrl}/paipan/xingxiang`);
    await formPage.getByRole("heading", { name: "出生信息" }).waitFor();
    await formPage.getByPlaceholder("请输入姓名").fill("测试");
    await formPage.evaluate(() => window.scrollTo(0, 0));
    await assertNoOverflow(formPage, `${viewport.width}px form`);
    await formPage.screenshot({ path: path.join(previewRoot, `xingxiang-form-${viewport.width}.png`), fullPage: true });
    await formContext.close();

    const resultContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const resultPage = await resultContext.newPage();
    await mockResult(resultPage);
    await resultPage.goto(`${baseUrl}/paipan/xingxiang/result`);
    await resultPage.locator(".xingxiang-palace-grid").waitFor();
    await assertNoOverflow(resultPage, `${viewport.width}px result`);
    await resultPage.screenshot({ path: path.join(previewRoot, `xingxiang-result-${viewport.width}.png`), fullPage: true });
    await resultContext.close();
  }
} finally {
  await browser.close();
}

console.log("Captured three responsive Xingxiang form/result pairs");
