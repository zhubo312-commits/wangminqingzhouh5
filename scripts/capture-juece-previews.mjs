import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { jueceGoldenCases } from "./juece-golden-cases.mjs";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const previewRoot = path.resolve(process.cwd(), "docs/previews");
const goldenRoot = path.resolve(process.cwd(), "docs/juece-golden");
const viewports = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const areas = [{
  label: "北京市",
  code: "110000",
  children: [{ label: "朝阳区", code: "110105", children: [] }],
}];

function referenceFor(index) {
  return `pp_${String(index + 1).padStart(32, "a")}`;
}

async function assertNoOverflow(page, label) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (hasOverflow) throw new Error(`${label} has horizontal overflow`);
}

async function mockAreas(page) {
  await page.route("**/api/v1/paipan/areas", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(areas),
  }));
}

async function mockResult(page, item, chart, index) {
  const paipanRef = referenceFor(index);
  await page.addInitScript(({ key, value }) => {
    window.sessionStorage.setItem(key, value);
  }, { key: "guoxue.paipan.shijia_juece_ref.v1", value: paipanRef });
  await page.route("**/api/v1/paipan/juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.shijia_juece.v1",
      chartType: "shijia_juece",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-11T08:00:00.000Z",
      expiresAt: "2026-08-11T20:00:00.000Z",
      chartRequest: item.request,
      chart,
    }),
  }));
}

await mkdir(previewRoot, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const firstChart = JSON.parse(await readFile(
    path.join(goldenRoot, jueceGoldenCases[0].id, "new-normalized.json"),
    "utf8",
  ));
  for (const viewport of viewports) {
    const formContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const formPage = await formContext.newPage();
    await mockAreas(formPage);
    await formPage.goto(`${baseUrl}/paipan/juece`);
    await formPage.getByRole("heading", { name: "起盘条件" }).waitFor();
    await formPage.waitForTimeout(220);
    await assertNoOverflow(formPage, `${viewport.width}px form`);
    await formPage.screenshot({
      path: path.join(previewRoot, `juece-form-${viewport.width}.png`),
      fullPage: true,
    });
    await formContext.close();

    const resultContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const resultPage = await resultContext.newPage();
    await mockResult(resultPage, jueceGoldenCases[0], firstChart, 0);
    await resultPage.goto(`${baseUrl}/paipan/juece/result`);
    await resultPage.getByRole("heading", { name: "阴遁5局" }).waitFor();
    await resultPage.locator(".juece-palace").filter({ hasText: "坤2" }).click();
    await resultPage.locator("#juece-palace-detail").waitFor();
    await resultPage.evaluate(() => window.scrollTo(0, 0));
    await resultPage.waitForTimeout(150);
    await assertNoOverflow(resultPage, `${viewport.width}px result`);
    await resultPage.screenshot({
      path: path.join(previewRoot, `juece-result-${viewport.width}.png`),
      fullPage: true,
    });
    await resultContext.close();
  }

  for (const [index, item] of jueceGoldenCases.entries()) {
    const chart = JSON.parse(await readFile(
      path.join(goldenRoot, item.id, "new-normalized.json"),
      "utf8",
    ));
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await mockResult(page, item, chart, index);
    await page.goto(`${baseUrl}/paipan/juece/result`);
    await page.getByRole("heading", { name: new RegExp(`[阴阳]遁${chart.overview.juNumber}局`) }).waitFor();
    await page.locator(".juece-palace").filter({ hasText: `坤2` }).click();
    await page.locator("#juece-palace-detail").waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await assertNoOverflow(page, `${item.id} 390px result`);
    await page.screenshot({
      path: path.join(goldenRoot, item.id, "result-390.png"),
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Captured three responsive form/result pairs and six 390px golden results");
