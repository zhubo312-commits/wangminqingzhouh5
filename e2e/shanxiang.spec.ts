import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"s".repeat(32)}`;

const palaceNames = [
  [1, "坎", "北方", "水"], [2, "坤", "西南", "土"], [3, "震", "东方", "木"],
  [4, "巽", "东南", "木"], [5, "中", "中央", "土"], [6, "乾", "西北", "金"],
  [7, "兑", "西方", "金"], [8, "艮", "东北", "土"], [9, "离", "南方", "火"],
] as const;

const panel = (degrees: number, juNumber: number) => ({
  overview: {
    degrees,
    direction: "癸",
    mountain: "丁",
    degreeRange: `${degrees}~${degrees + 4}`,
    dunType: "阴" as const,
    juNumber,
    yearPillar: "丙午",
    hourPillar: "己丑",
    voidBranches: "午未",
    xunShou: "甲申庚",
    chiefStar: { name: "天芮星", palace: 6 },
    chiefDoor: { name: "死", palace: 9 },
    horse: { branch: "亥", palace: 6 },
    huangQuan: "黄泉亥",
  },
  palaces: palaceNames.map(([index, trigram, direction, element]) => ({
    index, trigram, direction, element,
    deity: index === 5 ? null : "九天",
    star: index === 5 ? null : "天柱",
    door: index === 5 ? null : "生",
    heavenStems: index === 5 ? [] : ["戊"],
    earthStems: ["丁"],
    hiddenStem: index === 5 ? null : "辛",
    harms: index === 1 ? [{ symbol: "生", type: "迫" as const }] : [],
    heavenGrowth: index === 1 ? [{ branch: "子", stage: "胎" }] : [],
    earthGrowth: index === 1 ? [{ branch: "子", stage: "绝" }] : [],
    isVoid: index === 2 || index === 9,
    isHorse: index === 6,
    isChief: index === 6,
    isChiefDoor: index === 9,
  })),
});

const chart = {
  overview: { year: 2026, selectedDegrees: 0, question: "书房布局" },
  panels: [panel(0, 7), panel(5, 1), panel(10, 4)],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/paipan/shanxiang-juece/chart", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ...chart, paipan_ref: paipanRef, expiresAt: "2026-08-12T12:00:00.000Z" }),
  }));
  await page.route("**/api/v1/paipan/shanxiang-juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.shanxiang_juece.v1",
      chartType: "shanxiang_juece",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-12T10:00:00.000Z",
      expiresAt: "2026-08-12T12:00:00.000Z",
      chartRequest: { year: 2026, degrees: 0, question: "书房布局" },
      chart,
    }),
  }));
});

test("completes, switches and restores the three-panel Shanxiang chart", async ({ page }) => {
  await page.goto(appPath("/paipan/shanxiang-juece"));
  await expect(page.getByRole("heading", { name: "山向条件" })).toBeVisible();
  await page.getByLabel("排盘年份").fill("2026");
  await page.getByLabel("山向度数").fill("0");
  await page.getByPlaceholder("请输入需要研究的山向事项").fill("书房布局");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("button", { name: "开始山向排盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/shanxiang-juece\/result$/);
  await expect(page.getByRole("heading", { name: "丁山癸向" })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(page.locator(".shanxiang-palace")).toHaveCount(9);
  await expect(page.locator(".interpretation-entry")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("tab", { name: /5°/ }).click();
  await expect(page.getByRole("tab", { name: /5°/ })).toHaveAttribute("aria-selected", "true");
  await page.locator(".shanxiang-palace").filter({ hasText: "坎1" }).click();
  await expect(page.getByText("生 · 迫")).toBeVisible();

  await page.getByRole("button", { name: "放大查看" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭放大查看" }).click();

  await page.reload();
  await expect(page.getByRole("heading", { name: "丁山癸向" })).toBeVisible();
  await expect(page.locator(".shanxiang-palace")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
