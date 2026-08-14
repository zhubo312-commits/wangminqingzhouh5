import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/"
  ? ""
  : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"y".repeat(32)}`;

const lifetimeChart = {
  profile: {
    name: "", gender: "male" as const, birthDateTime: "2026-08-11 21:31", lunarDate: "二〇二六年六月廿九日亥时",
    area: "未知", areaCode: "999999", trueSolarTime: null, chineseZodiac: "马", zodiac: "狮子",
  },
  basicFacts: {
    benMingFo: "", taiYuan: "", taiYuanNaYin: "", mingGong: "", mingGongNaYin: "", duiChong: "",
    sanSha: "", wenChangWei: "", prevSolarTerm: "立秋", nextSolarTerm: "处暑",
  },
  pillars: (["year", "month", "day", "hour"] as const).map((key) => ({
    key, label: key, stem: "丙", branch: "午", stemElement: "火", branchElement: "火", tenGod: "比肩",
    hiddenStems: [], growth: "帝旺", selfSeat: "帝旺", naYin: "天河水", voidBranch: "戌亥", shenSha: [],
  })),
  attention: { heavenlyStems: [], earthlyBranches: [] },
  shenShaDescriptions: {},
  fortune: {
    startSolar: "2035-01-23 19:31:00", startDescription: "出生后8年5月11天2时起运", changeDescription: "",
    periods: Array.from({ length: 11 }, (_, index) => ({
      index, startYear: index === 0 ? 2026 : 2025 + index * 10, endYear: index === 0 ? 2034 : 2034 + index * 10,
      startAge: index === 0 ? 1 : index * 10, endAge: index === 0 ? 9 : index * 10 + 9,
      ganZhi: index === 0 ? "" : ["丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯", "甲辰", "乙巳", "丙午"][index - 1],
      tenGods: [], growth: "", hiddenStems: "", hiddenStemTenGods: [], wealthStrong: false,
      heavenlyStemAttention: [], earthlyBranchAttention: [], shenSha: [], years: [],
    })),
  },
  strength: {
    legacyScore: 0, samePartyScore: 0, otherPartyScore: 0, level: "日主偏旺，身强",
    pattern: "扶抑格，劫比主导的偏旺格。", summary: "", favorableGod: "", favorableElements: [], relationScores: {},
  },
};

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
    hiddenStem: ({ 1: "乙", 2: "癸", 3: "丁", 4: "庚", 5: null, 6: "丙", 7: "辛戊", 8: "壬", 9: "己" } as Record<number, string | null>)[index],
    harms: index === 1 ? [{ symbol: "开", type: "迫" as const }] : [],
    heavenGrowth: index === 1 ? [{ branch: "子", stage: "死" }] : [],
    earthGrowth: index === 1 ? [{ branch: "子", stage: "病" }] : [],
    isVoid: index === 3 || index === 8,
    isHorse: index === 4,
    isChief: index === 6,
    isChiefDoor: index === 7,
  })),
  heavenEarthGates: [
    ["子", "登明亥", "执"], ["丑", "神后子", "破"], ["寅", "大吉丑", "危"], ["卯", "功曹寅", "成"],
    ["辰", "太冲卯", "收"], ["巳", "天罡辰", "开"], ["午", "太乙巳", "闭"], ["未", "胜光午", "建"],
    ["申", "小吉未", "除"], ["酉", "传送申", "满"], ["戌", "从魁酉", "平"], ["亥", "河魁戌", "定"],
  ].map(([branch, heavenGate, earthGate]) => ({ branch, heavenGate, earthGate })),
  lifetimeChart,
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
        lifetime: true,
      },
      chart,
    }),
  }));
});

test("completes and restores the Yinpan chart with two outer rings and no page overflow", async ({ page }) => {
  await page.goto(appPath("/paipan/yinpan-juece"));

  await expect(page.getByRole("heading", { name: "起局信息" })).toBeVisible();
  await expect(page.getByRole("button", { name: /时盘排盘/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /刻盘排盘/ })).toHaveAttribute("aria-pressed", "false");
  await page.getByPlaceholder("请输入想要研究的事项").fill("项目安排");
  await page.locator('input[type="checkbox"]').check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("button", { name: "开始时盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/yinpan-juece\/result$/);
  await expect(page.getByRole("heading", { name: "阴遁9局" })).toBeVisible();
  await expect(page.locator(".yinpan-palace")).toHaveCount(9);
  await expect(page.locator(".yinpan-orbit-hidden")).toHaveCount(8);
  await expect(page.locator(".yinpan-orbit-hidden.top")).toHaveText("己");
  await expect(page.locator(".yinpan-orbit-hidden.bottom")).toHaveText("乙");
  await expect(page.locator(".interpretation-entry")).toHaveCount(0);
  const switchButtons = page.locator('.yinpan-switch-grid [data-paipan-action="navigate"]');
  await expect(switchButtons).toHaveCount(4);
  await expect(switchButtons.nth(0)).toHaveAttribute("data-direction", "previous");
  await expect(switchButtons.nth(1)).toHaveAttribute("data-direction", "previous");
  await expect(switchButtons.nth(2)).toHaveAttribute("data-direction", "next");
  await expect(switchButtons.nth(3)).toHaveAttribute("data-direction", "next");
  const switchButtonColors = await switchButtons.evaluateAll((buttons) => buttons.map((button) => getComputedStyle(button).backgroundColor));
  expect(switchButtonColors).toHaveLength(4);
  expect(switchButtonColors.every((color) => color.includes("178, 77, 52"))).toBe(true);
  await expect(page.locator('.juece-chart-actions [data-paipan-action="zoom"]')).toHaveCount(1);
  await expect(page.locator('.juece-chart-actions [data-paipan-action="restart"]')).toHaveCount(1);
  const chartActionColors = await page.locator(".juece-chart-actions button").evaluateAll((buttons) => buttons.map((button) => getComputedStyle(button).backgroundColor));
  expect(chartActionColors[0]).toBe("rgb(178, 77, 52)");
  expect(chartActionColors[1]).not.toBe(chartActionColors[0]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const gateToggle = page.getByRole("switch", { name: "天门地户" });
  await expect(page.locator(".yinpan-orbit-board + .yinpan-gate-switch")).toHaveCount(1);
  await expect(page.locator(".yinpan-gate-switch + .juece-chart-actions")).toHaveCount(1);
  await expect(gateToggle).toHaveAttribute("aria-checked", "false");
  await gateToggle.click();
  await expect(gateToggle).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".yinpan-orbit-gate.top")).toHaveCount(3);
  await expect(page.locator(".yinpan-orbit-gate.left")).toHaveCount(3);
  await expect(page.locator(".yinpan-orbit-gate.right")).toHaveCount(3);
  await expect(page.locator(".yinpan-orbit-gate.bottom")).toHaveCount(3);
  await expect(page.locator(".yinpan-orbit-gate.top").first()).toContainText("天罡辰");
  await expect(page.locator(".yinpan-orbit-gate.bottom").first()).toContainText("神后子");
  const gatesFitTheirRings = await page.locator(".yinpan-orbit-gate").evaluateAll((gates) => gates.every((gate) => {
    const ring = gate.getBoundingClientRect();
    return Array.from(gate.children).every((child) => {
      const content = child.getBoundingClientRect();
      return content.left >= ring.left - 1 && content.right <= ring.right + 1
        && content.top >= ring.top - 1 && content.bottom <= ring.bottom + 1;
    });
  }));
  expect(gatesFitTheirRings).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("button", { name: "放大查看" }).click();
  const zoomDialog = page.getByRole("dialog", { name: "阴盘九宫放大图" });
  await expect(zoomDialog).toBeVisible();
  const zoomFit = await zoomDialog.locator(".juece-zoom-scroll").evaluate((scroll) => {
    const board = scroll.querySelector<HTMLElement>(".yinpan-orbit-board.zoomed")!;
    const rightRing = board.querySelector<HTMLElement>(".yinpan-orbit-gate.right.slot-3")!;
    const scrollRect = scroll.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const rightRingRect = rightRing.getBoundingClientRect();
    return {
      noHorizontalScroll: scroll.scrollWidth <= scroll.clientWidth + 1,
      boardFits: boardRect.left >= scrollRect.left - 1 && boardRect.right <= scrollRect.right + 1,
      rightRingFits: rightRingRect.right <= scrollRect.right + 1,
    };
  });
  expect(zoomFit).toEqual({ noHorizontalScroll: true, boardFits: true, rightRingFits: true });
  await page.getByRole("button", { name: "关闭放大查看" }).click();

  await expect(page.getByText("出生后8年5月11天2时起运")).toBeVisible();
  await expect(page.getByRole("list", { name: "大运列表" }).getByRole("listitem")).toHaveCount(11);
  const fortuneGrid = page.locator(".yinpan-fortune-grid");
  expect(await fortuneGrid.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const fortuneRowTops = await fortuneGrid.getByRole("listitem").evaluateAll((items) => items.slice(0, 5).map((item) => Math.round(item.getBoundingClientRect().top)));
  expect(new Set(fortuneRowTops.slice(0, 4)).size).toBe(1);
  expect(fortuneRowTops[4]).toBeGreaterThan(fortuneRowTops[0]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const topRowPalace = page.locator(".yinpan-palace").filter({ hasText: "巽4" });
  await topRowPalace.click();
  await expect(page.locator(".yinpan-orbit-row.row-1 + .yinpan-palace-detail")).toBeVisible();

  const firstPalace = page.locator(".yinpan-palace").filter({ hasText: "坎1" });
  await firstPalace.click();
  await expect(firstPalace).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("开 · 迫")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "阴遁9局" })).toBeVisible();
  await expect(page.locator(".yinpan-palace")).toHaveCount(9);
  await expect(page.locator(".yinpan-orbit-hidden")).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
