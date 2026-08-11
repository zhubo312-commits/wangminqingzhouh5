import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const previewRoot = path.resolve(process.cwd(), "docs/previews");
const viewports = [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 430, height: 932 }];
const paipanRef = `pp_${"l".repeat(32)}`;
const originalLines = ["yang", "yin", "yang", "yin", "yang", "yang"];
const changedLines = ["yang", "yang", "yang", "yin", "yang", "yin"];
const deities = ["青龙", "玄武", "白虎", "螣蛇", "勾陈", "朱雀"];
const originalKin = ["父母", "兄弟", "子孙", "兄弟", "官鬼", "父母"];
const originalGz = ["己巳", "己未", "己酉", "丁丑", "丁卯", "丁巳"];
const changedKin = ["兄弟", "子孙", "父母", "父母", "兄弟", "官鬼"];
const changedGz = ["壬戌", "壬申", "壬午", "戊午", "戊辰", "戊寅"];
const element = (value) => "巳午".includes(value[1]) ? "火" : "申酉".includes(value[1]) ? "金" : "寅卯".includes(value[1]) ? "木" : "子亥".includes(value[1]) ? "水" : "土";
const chart = {
  overview: { method: "硬币背数法", question: "项目安排", solarDateTime: "2026-08-11 21:31", lunarDate: "丙午年丙申月丁巳日辛亥时", pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" }, voidBranches: "子丑", coinBacks: "312101" },
  original: { name: "火泽睽", upperTrigram: "离", lowerTrigram: "兑", lines: originalLines, palace: { name: "艮宫", sequence: 5, type: null, element: "土" }, shiLine: 4, yingLine: 1 },
  changed: { name: "天水讼", upperTrigram: "乾", lowerTrigram: "坎", lines: changedLines, palace: { name: "离宫", sequence: 7, type: "游魂", element: "火" }, shiLine: 4, yingLine: 1 },
  lines: originalLines.map((originalLine, index) => ({ position: 6 - index, deity: deities[index], hiddenKin: index === 1 ? "妻财" : null, hiddenStemBranch: index === 1 ? "丙子" : null, originalKin: originalKin[index], originalStemBranch: originalGz[index], originalElement: element(originalGz[index]), originalLine, isMoving: index === 1 || index === 5, marker: index === 2 ? "世" : index === 5 ? "应" : null, changedKin: changedKin[index], changedStemBranch: changedGz[index], changedElement: element(changedGz[index]), changedLine: changedLines[index] })),
};

async function assertNoOverflow(page, label) {
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`${label} has horizontal overflow`);
}

async function mockResult(page) {
  await page.addInitScript(({ key, value }) => window.sessionStorage.setItem(key, value), { key: "guoxue.paipan.luoji_ref.v1", value: paipanRef });
  await page.route("**/api/v1/paipan/luoji/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ schemaVersion: "guoxue.paipan.luoji.v1", chartType: "luoji", paipan_ref: paipanRef, generatedAt: "2026-08-12T00:00:00.000Z", expiresAt: "2026-08-12T12:00:00.000Z", chartRequest: { chartDateTime: "2026-08-11 21:31", question: "项目安排", mode: "backs", coinBacks: "312101" }, chart }),
  }));
}

await mkdir(previewRoot, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const viewport of viewports) {
    const formContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const formPage = await formContext.newPage();
    await formPage.goto(`${baseUrl}/paipan/luoji`);
    await formPage.getByRole("heading", { name: "选择起盘方式" }).waitFor();
    for (let index = 0; index < 4; index += 1) await formPage.getByRole("button", { name: /摇一次铜钱/ }).click();
    await formPage.evaluate(() => window.scrollTo(0, 0));
    await assertNoOverflow(formPage, `${viewport.width}px form`);
    await formPage.screenshot({ path: path.join(previewRoot, `luoji-form-${viewport.width}.png`), fullPage: true });
    await formContext.close();

    const resultContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const resultPage = await resultContext.newPage();
    await mockResult(resultPage);
    await resultPage.goto(`${baseUrl}/paipan/luoji/result`);
    await resultPage.locator(".luoji-lines-table").waitFor();
    await assertNoOverflow(resultPage, `${viewport.width}px result`);
    await resultPage.screenshot({ path: path.join(previewRoot, `luoji-result-${viewport.width}.png`), fullPage: true });
    await resultContext.close();
  }
} finally {
  await browser.close();
}

console.log("Captured three responsive Luoji form/result pairs");
