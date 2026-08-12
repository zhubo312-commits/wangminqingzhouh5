import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const previewRoot = path.resolve(process.cwd(), "docs/previews");
const viewports = [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 430, height: 932 }];
const paipanRef = `pp_${"s".repeat(32)}`;
const palaceNames = [
  [1, "坎", "北方", "水"], [2, "坤", "西南", "土"], [3, "震", "东方", "木"],
  [4, "巽", "东南", "木"], [5, "中", "中央", "土"], [6, "乾", "西北", "金"],
  [7, "兑", "西方", "金"], [8, "艮", "东北", "土"], [9, "离", "南方", "火"],
];

const panel = (degrees, juNumber, chiefStar, chiefStarPalace, chiefDoor, chiefDoorPalace) => ({
  overview: {
    degrees, direction: "癸", mountain: "丁", degreeRange: `${degrees}~${degrees + 4}`,
    dunType: "阴", juNumber, yearPillar: "丙午", hourPillar: "己丑", voidBranches: "午未",
    xunShou: "甲申庚", chiefStar: { name: chiefStar, palace: chiefStarPalace },
    chiefDoor: { name: chiefDoor, palace: chiefDoorPalace }, horse: { branch: "亥", palace: 6 }, huangQuan: "黄泉亥",
  },
  palaces: palaceNames.map(([index, trigram, direction, element]) => ({
    index, trigram, direction, element,
    deity: index === 5 ? null : "九天", star: index === 5 ? null : "天柱", door: index === 5 ? null : "生",
    heavenStems: index === 5 ? [] : ["戊"], earthStems: ["丁"], hiddenStem: index === 5 ? null : "辛",
    harms: index === 1 ? [{ symbol: "生", type: "迫" }] : [],
    heavenGrowth: index === 1 ? [{ branch: "子", stage: "胎" }] : [],
    earthGrowth: index === 1 ? [{ branch: "子", stage: "绝" }] : [],
    isVoid: index === 2 || index === 9, isHorse: index === 6,
    isChief: index === chiefStarPalace, isChiefDoor: index === chiefDoorPalace,
  })),
});

const chart = {
  overview: { year: 2026, selectedDegrees: 0, question: "书房布局" },
  panels: [
    panel(0, 7, "天芮星", 6, "死", 9),
    panel(5, 1, "天任星", 9, "生", 3),
    panel(10, 4, "天芮星", 3, "死", 6),
  ],
};

async function assertNoOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (hasOverflow) throw new Error(`${label} has horizontal overflow`);
}

async function mockResult(page) {
  await page.addInitScript(({ key, value }) => window.sessionStorage.setItem(key, value), {
    key: "guoxue.paipan.shanxiang_juece_ref.v1", value: paipanRef,
  });
  await page.route("**/api/v1/paipan/shanxiang-juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.shanxiang_juece.v1", chartType: "shanxiang_juece", paipan_ref: paipanRef,
      generatedAt: "2026-08-12T00:00:00.000Z", expiresAt: "2026-08-12T12:00:00.000Z",
      chartRequest: { year: 2026, degrees: 0, question: "书房布局" }, chart,
    }),
  }));
}

await mkdir(previewRoot, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  for (const viewport of viewports) {
    const formContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const formPage = await formContext.newPage();
    await formPage.goto(`${baseUrl}/paipan/shanxiang-juece`);
    await formPage.getByRole("heading", { name: "山向条件" }).waitFor();
    await assertNoOverflow(formPage, `${viewport.width}px form`);
    await formPage.screenshot({ path: path.join(previewRoot, `shanxiang-form-${viewport.width}.png`), fullPage: true });
    await formContext.close();

    const resultContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const resultPage = await resultContext.newPage();
    await mockResult(resultPage);
    await resultPage.goto(`${baseUrl}/paipan/shanxiang-juece/result`);
    await resultPage.getByRole("heading", { name: "丁山癸向" }).waitFor();
    await resultPage.locator(".shanxiang-palace").filter({ hasText: "坎1" }).click();
    await resultPage.waitForTimeout(250);
    await resultPage.evaluate(() => window.scrollTo(0, 0));
    await assertNoOverflow(resultPage, `${viewport.width}px result`);
    await resultPage.screenshot({ path: path.join(previewRoot, `shanxiang-result-${viewport.width}.png`), fullPage: true });
    await resultContext.close();
  }
} finally {
  await browser.close();
}

console.log("Captured three responsive Shanxiang form/result pairs");
