import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const previewRoot = path.resolve(process.cwd(), "docs/previews");
const viewports = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const paipanRef = `pp_${"m".repeat(32)}`;
const trigram = (index, key, name, symbol, element, lines) => ({ index, key, name, symbol, element, lines });
const chart = {
  overview: {
    method: "时间起盘",
    solarDateTime: "2026-08-11 21:31",
    lunarDate: "丙午年六月廿九日亥时",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" },
    voidBranches: "子丑",
    school: null,
    numberOne: null,
    numberTwo: null,
    includeHour: false,
  },
  upperTrigram: 2,
  lowerTrigram: 6,
  movingLine: 6,
  original: { key: "duikan", name: "泽水困", upper: trigram(2, "dui", "兑", "☱", "金", ["yin", "yang", "yang"]), lower: trigram(6, "kan", "坎", "☵", "水", ["yin", "yang", "yin"]), lines: ["yin", "yang", "yin", "yang", "yang", "yin"] },
  mutual: { key: "xunli", name: "风火家人", upper: trigram(5, "xun", "巽", "☴", "木", ["yang", "yang", "yin"]), lower: trigram(3, "li", "离", "☲", "火", ["yang", "yin", "yang"]), lines: ["yang", "yin", "yang", "yin", "yang", "yang"] },
  changed: { key: "qiankan", name: "天水讼", upper: trigram(1, "qian", "乾", "☰", "金", ["yang", "yang", "yang"]), lower: trigram(6, "kan", "坎", "☵", "水", ["yin", "yang", "yin"]), lines: ["yin", "yang", "yin", "yang", "yang", "yang"] },
};

async function assertNoOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (hasOverflow) throw new Error(`${label} has horizontal overflow`);
}

async function mockResult(page) {
  await page.addInitScript(({ key, value }) => window.sessionStorage.setItem(key, value), { key: "guoxue.paipan.meihua_ref.v1", value: paipanRef });
  await page.route("**/api/v1/paipan/meihua/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.meihua.v1",
      chartType: "meihua",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-12T00:00:00.000Z",
      expiresAt: "2026-08-12T12:00:00.000Z",
      chartRequest: { chartDateTime: "2026-08-11 21:31", mode: "time" },
      chart,
    }),
  }));
}

await mkdir(previewRoot, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  for (const viewport of viewports) {
    const formContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const formPage = await formContext.newPage();
    await formPage.goto(`${baseUrl}/paipan/meihua`);
    await formPage.getByRole("heading", { name: "选择起盘方式" }).waitFor();
    await assertNoOverflow(formPage, `${viewport.width}px form`);
    await formPage.screenshot({ path: path.join(previewRoot, `meihua-form-${viewport.width}.png`), fullPage: true });
    await formContext.close();

    const resultContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const resultPage = await resultContext.newPage();
    await mockResult(resultPage);
    await resultPage.goto(`${baseUrl}/paipan/meihua/result`);
    await resultPage.getByRole("heading", { name: "本卦 · 互卦 · 变卦" }).waitFor();
    await assertNoOverflow(resultPage, `${viewport.width}px result`);
    await resultPage.screenshot({ path: path.join(previewRoot, `meihua-result-${viewport.width}.png`), fullPage: true });
    await resultContext.close();
  }
} finally {
  await browser.close();
}

console.log("Captured three responsive Meihua form/result pairs");
