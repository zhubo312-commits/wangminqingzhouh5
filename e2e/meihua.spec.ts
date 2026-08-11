import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"m".repeat(32)}`;

const trigram = (index: number, key: string, name: string, symbol: string, element: string, lines: string[]) => ({ index, key, name, symbol, element, lines });
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

test("covers the five Meihua entries, chart result, classics and context restore without overflow", async ({ page }) => {
  let latestRequest = { chartDateTime: "2026-08-11 21:31", mode: "time" };
  await page.route("**/api/v1/paipan/meihua/chart", async (route) => {
    latestRequest = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...chart, overview: { ...chart.overview, solarDateTime: latestRequest.chartDateTime }, paipan_ref: paipanRef, expiresAt: "2026-08-12T12:00:00.000Z" }) });
  });
  await page.route("**/api/v1/paipan/meihua/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ schemaVersion: "guoxue.paipan.meihua.v1", chartType: "meihua", paipan_ref: paipanRef, generatedAt: "2026-08-12T10:00:00.000Z", expiresAt: "2026-08-12T12:00:00.000Z", chartRequest: latestRequest, chart: { ...chart, overview: { ...chart.overview, solarDateTime: latestRequest.chartDateTime } } }),
  }));

  await page.goto(appPath("/paipan/meihua"));
  await expect(page.getByRole("heading", { name: "选择起盘方式" })).toBeVisible();
  await expect(page.locator(".meihua-entry-grid button")).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("button", { name: /随机起盘/ }).click();
  await expect(page.getByText(/随机取得上卦、下卦与动爻/)).toBeVisible();
  await page.getByRole("button", { name: /报数起盘/ }).click();
  await expect(page.getByPlaceholder("请输入正整数")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "朱昱／易谦老师" })).toBeVisible();
  await expect(page.getByRole("button", { name: "广元老师" })).toBeVisible();
  await page.getByRole("button", { name: /指定起盘/ }).click();
  await expect(page.getByText(/日期时间仅用于展示/)).toBeVisible();
  await expect(page.locator(".meihua-select-grid select")).toHaveCount(3);

  await page.getByRole("button", { name: /八宫六十四卦/ }).click();
  await expect(page.locator(".meihua-classic-grid button")).toHaveCount(64);
  await page.getByLabel("搜索六十四卦").fill("未济");
  await expect(page.locator(".meihua-classic-grid button")).toHaveCount(1);
  await page.locator(".meihua-classic-grid button").click();
  await expect(page.getByRole("dialog", { name: "火水未济" })).toBeVisible();
  await expect(page.getByText("未济：亨，小狐汔济，濡其尾，无攸利。")).toBeVisible();
  await page.getByRole("button", { name: "关闭卦象原文" }).click();

  await page.getByRole("button", { name: /时间起盘/ }).click();
  await page.getByRole("button", { name: "选时起盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/meihua\/result$/);
  expect(latestRequest.mode).toBe("time");
  await expect(page.getByRole("heading", { name: "泽水困" }).first()).toBeVisible();
  await expect(page.locator(".meihua-hexagram-card")).toHaveCount(3);
  await expect(page.locator(".meihua-lines .moving")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.locator(".meihua-hexagram-card").first().click();
  await expect(page.getByRole("dialog", { name: "泽水困" })).toBeVisible();
  await page.getByRole("button", { name: "关闭卦象原文" }).click();

  await page.reload();
  await expect(page.getByRole("heading", { name: "泽水困" }).first()).toBeVisible();
  await expect(page.locator(".meihua-hexagram-card")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
