import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/"
  ? ""
  : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"y".repeat(32)}`;

const palaceNames = [
  [1, "坎", "北方", "水"], [2, "坤", "西南", "土"], [3, "震", "东方", "木"],
  [4, "巽", "东南", "木"], [5, "中", "中央", "土"], [6, "乾", "西北", "金"],
  [7, "兑", "西方", "金"], [8, "艮", "东北", "土"], [9, "离", "南方", "火"],
] as const;

const chart = {
  overview: {
    method: "时盘" as const,
    question: "项目安排",
    gender: "male" as const,
    solarDateTime: "2026-08-11 21:31",
    lunarDate: "二〇二六年六月廿九日",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" },
    voidBranches: "寅卯",
    dunType: "阴" as const,
    juNumber: 9,
    xunShou: "甲辰壬",
    chiefStar: { name: "天芮星", palace: 6 },
    chiefDoor: { name: "死", palace: 7 },
    previousSolarTerm: "立秋",
    nextSolarTerm: "处暑",
    monthGeneral: "午",
    horse: { branch: "巳", palace: 4 },
  },
  palaces: palaceNames.map(([index, trigram, direction, element]) => ({
    index, trigram, direction, element,
    deity: index === 5 ? null : "九天",
    star: index === 5 ? null : "天柱",
    door: index === 5 ? null : "开",
    heavenStems: index === 5 ? [] : ["庚"],
    earthStems: ["乙"],
    hiddenStem: index === 5 ? null : "己",
    harms: index === 1 ? [{ symbol: "开", type: "迫" as const }] : [],
    heavenGrowth: index === 1 ? [{ branch: "子", stage: "死" }] : [],
    earthGrowth: index === 1 ? [{ branch: "子", stage: "病" }] : [],
    isVoid: index === 3 || index === 8,
    isHorse: index === 4,
    isChief: index === 6,
    isChiefDoor: index === 7,
  })),
  heavenEarthGates: "子丑寅卯辰巳午未申酉戌亥".split("").map((branch, index) => ({
    branch,
    heavenGate: `天门${index + 1}`,
    earthGate: `地户${index + 1}`,
  })),
  lifetimeChart: null,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/paipan/yinpan-juece/chart", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ...chart, paipan_ref: paipanRef, expiresAt: "2026-08-12T12:00:00.000Z" }),
  }));
  await page.route("**/api/v1/paipan/yinpan-juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.yinpan_juece.v1",
      chartType: "yinpan_juece",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-12T10:00:00.000Z",
      expiresAt: "2026-08-12T12:00:00.000Z",
      chartRequest: {
        chartDateTime: "2026-08-11 21:31",
        gender: "male",
        question: "项目安排",
        mode: "time",
        lifetime: false,
      },
      chart,
    }),
  }));
});

test("completes and restores the Yinpan chart without horizontal overflow", async ({ page }) => {
  await page.goto(appPath("/paipan/yinpan-juece"));

  await expect(page.getByRole("heading", { name: "起局信息" })).toBeVisible();
  await expect(page.getByRole("button", { name: /时盘排盘/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /刻盘排盘/ })).toHaveAttribute("aria-pressed", "false");
  await page.getByPlaceholder("请输入想要研究的事项").fill("项目安排");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("button", { name: "开始时盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/yinpan-juece\/result$/);
  await expect(page.getByRole("heading", { name: "阴遁9局" })).toBeVisible();
  await expect(page.locator(".yinpan-palace")).toHaveCount(9);
  await expect(page.locator(".interpretation-entry")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const firstPalace = page.locator(".yinpan-palace").filter({ hasText: "坎1" });
  await firstPalace.click();
  await expect(firstPalace).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("开 · 迫")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "阴遁9局" })).toBeVisible();
  await expect(page.locator(".yinpan-palace")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
