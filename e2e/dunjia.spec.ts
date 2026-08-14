import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/"
  ? ""
  : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"d".repeat(32)}`;

const palaceNames = [
  [1, "坎", "北", "水"],
  [2, "坤", "西南", "土"],
  [3, "震", "东", "木"],
  [4, "巽", "东南", "木"],
  [5, "中", "中", "土"],
  [6, "乾", "西北", "金"],
  [7, "兑", "西", "金"],
  [8, "艮", "东北", "土"],
  [9, "离", "南", "火"],
] as const;

const chart = {
  overview: {
    method: "转盘-拆补-寄坤二宫" as const,
    solarDateTime: "2026-08-11 13:35",
    lunarDate: "丙午年六月廿九日未时",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "丁未" },
    voidBranches: { year: "寅卯", month: "辰巳", day: "子丑", hour: "寅卯" },
    previousSolarTerm: { name: "立秋", dateTime: "2026-08-07 19:42:40" },
    nextSolarTerm: { name: "处暑", dateTime: "2026-08-23 10:18:46" },
    dunType: "阴" as const,
    juNumber: 5,
    xunShou: "甲辰壬",
    chiefStar: { name: "天蓬", palace: 8 },
    chiefDoor: { name: "休", palace: 7 },
    horse: { trigram: "巽", branch: "巳" },
  },
  palaces: palaceNames.map(([index, trigram, direction, element]) => ({
    index,
    trigram,
    direction,
    element,
    deity: index === 5 ? null : ["九地", "玄武", "白虎", "六合", "", "太阴", "螣蛇", "值符", "九天"][index - 1],
    star: index === 5 ? null : ["天任", "天英", "天辅", "天冲", "", "天心", "天柱", "天蓬", "天芮"][index - 1],
    door: index === 5 ? null : ["生", "景", "杜", "伤", "", "开", "惊", "休", "死"][index - 1],
    heavenPlate: ["乙", "辛", "丙", "丁", "戊", "己", "庚", "壬", "癸"][index - 1],
    earthPlate: ["癸", "己", "辛", "庚", "戊", "丁", "丙", "乙", "壬"][index - 1],
    hiddenStem: index === 5 ? null : ["癸", "己", "辛", "庚", "", "丁", "丙", "乙", "壬"][index - 1],
    isVoid: index === 3 || index === 4,
    isChief: index === 8,
    isChiefDoor: index === 7,
    isHorse: index === 4,
    harms: index === 8
      ? [{ symbol: "壬", type: "刑" as const }, { symbol: "休", type: "迫" as const }]
      : index === 2
        ? [{ symbol: "辛", type: "墓" as const }]
        : [],
    heavenGrowth: index === 8 ? [{ branch: "寅", stage: "病" }, { branch: "丑", stage: "衰" }] : [],
    earthGrowth: index === 8 ? [{ branch: "寅", stage: "临官" }, { branch: "丑", stage: "冠带" }] : [],
  })),
  heavenEarthGates: "子丑寅卯辰巳午未申酉戌亥".split("").map((branch, index) => ({
    branch,
    heavenGate: ["太冲卯", "小吉未", "从魁酉", "登明亥", "河魁戌", "传送申", "胜光午", "太乙巳", "天罡辰", "功曹寅", "大吉丑", "神后子"][index],
    earthGate: ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"][index],
  })),
};

const home = {
  date: "2026-08-11",
  weekday: "星期二",
  calendar: { lunarYear: "丙午年", lunarMonth: "六月", lunarDay: "廿九", zodiac: "马", solarTerm: null },
  guidance: { text: "静观其变，审势而行。", suitable: ["静心"], avoid: ["躁进"] },
  links: {
    interpretation: "https://example.com/interpretation",
    learning: "https://example.com/learning",
    question: "https://example.com/question",
  },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/home", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(home),
  }));
  await page.route("**/api/v1/events", (route) => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/v1/paipan/dunjia/chart", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ...chart, paipan_ref: paipanRef, expiresAt: "2026-08-11T12:00:00.000Z" }),
  }));
  await page.route("**/api/v1/paipan/dunjia/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.dunjia.v1",
      chartType: "dunjia",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-11T10:00:00.000Z",
      expiresAt: "2026-08-11T12:00:00.000Z",
      chartRequest: { chartDateTime: "2026-08-11 13:35" },
      chart,
    }),
  }));
});

test("completes and restores the Dunjia chart without horizontal overflow", async ({ page }) => {
  const resolvedLunarSolarDateTime = "1990-07-21 12:00";
  let receivedBirthRequest: Record<string, unknown> | null = null;
  await page.route("**/api/v1/paipan/bazi/resolve-birth", async (route) => {
    receivedBirthRequest = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [{
          id: resolvedLunarSolarDateTime,
          solarDateTime: resolvedLunarSolarDateTime,
          label: `${resolvedLunarSolarDateTime}（阳历）`,
        }],
        sect: 2,
      }),
    });
  });

  await page.goto(appPath("/paipan/dunjia"));

  await expect(page.getByRole("heading", { name: "起盘时间" })).toBeVisible();
  await expect(page.getByText("转盘", { exact: true })).toBeVisible();
  await expect(page.getByText("拆补", { exact: true })).toBeVisible();
  await expect(page.getByText("寄坤二宫", { exact: true })).toBeVisible();
  await expect(page.getByText("时空", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择阳历日期" })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择阳历时间" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("tab", { name: "阴历" }).click();
  const lunarDatePicker = page.getByRole("button", { name: "选择阴历日期" });
  await lunarDatePicker.click();
  const lunarDateDialog = page.getByRole("dialog", { name: "选择阴历起盘日期" });
  const yearWheel = lunarDateDialog.getByRole("listbox", { name: "年滚轮" });
  const monthWheel = lunarDateDialog.getByRole("listbox", { name: "月滚轮" });
  const dayWheel = lunarDateDialog.getByRole("listbox", { name: "日滚轮" });

  await yearWheel.getByRole("option", { name: "1989", exact: true }).click();
  await expect(monthWheel.getByRole("option", { name: /^闰/ })).toHaveCount(0);

  await yearWheel.getByRole("option", { name: "1990", exact: true }).click();
  const ordinaryMay = monthWheel.getByRole("option", { name: "五月（5）", exact: true });
  const leapMay = monthWheel.getByRole("option", { name: "闰五月（5）", exact: true });
  await expect(leapMay).toBeVisible();
  await ordinaryMay.click();
  const dayThirty = dayWheel.getByRole("option", { name: "三十（30）", exact: true });
  await expect(dayThirty).toBeVisible();
  await dayThirty.click();
  await leapMay.click();
  await expect(dayThirty).toHaveCount(0);
  await expect(dayWheel.getByRole("option", { name: "廿九（29）", exact: true })).toHaveAttribute("aria-selected", "true");

  await yearWheel.getByRole("option", { name: "1989", exact: true }).click();
  await expect(monthWheel.getByRole("option", { name: /^闰/ })).toHaveCount(0);
  await expect(monthWheel.getByRole("option", { name: "五月（5）", exact: true })).toHaveAttribute("aria-selected", "true");
  await yearWheel.getByRole("option", { name: "1990", exact: true }).click();
  await monthWheel.getByRole("option", { name: "闰五月（5）", exact: true }).click();
  expect(await lunarDateDialog.evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth)).toBe(false);
  await lunarDateDialog.getByRole("button", { name: "确定" }).click();
  await expect(lunarDatePicker).toContainText("1990年 闰五月（5） 廿九（29）");

  const chartRequestPromise = page.waitForRequest("**/api/v1/paipan/dunjia/chart");
  await page.getByRole("button", { name: "开始排盘" }).click();
  const chartRequest = await chartRequestPromise;
  expect(receivedBirthRequest).toEqual({
    mode: "lunar",
    lunar: {
      year: 1990,
      month: 5,
      day: 29,
      hour: 12,
      minute: 0,
      leapMonth: true,
    },
  });
  expect(chartRequest.postDataJSON()).toMatchObject({ chartDateTime: resolvedLunarSolarDateTime });
  await expect(page).toHaveURL(/\/paipan\/dunjia\/result$/);
  await expect(page.getByRole("heading", { name: "阴遁5局" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "节气与旬首" })).toBeVisible();
  await expect(page.locator(".dunjia-term-grid .info-pair").filter({ hasText: "立秋" })).toBeVisible();
  await expect(page.locator(".interpretation-entry")).toHaveCount(0);
  await expect(page.locator(".dunjia-palace")).toHaveCount(9);
  const pillarDayStemMarker = page.locator('[data-day-stem-location="pillar"]');
  await expect(pillarDayStemMarker).toHaveText("丁");
  await expect(pillarDayStemMarker).toHaveCSS("color", "rgb(178, 77, 52)");
  await expect(pillarDayStemMarker).toHaveCSS("border-top-color", "rgb(178, 77, 52)");
  await expect(page.locator('[data-day-stem-location="heaven"]')).toHaveCount(1);
  const dayStemPalace = page.locator(".dunjia-palace").filter({ hasText: "巽4" });
  await expect(dayStemPalace.locator('[data-day-stem-location="heaven"]')).toHaveText("丁");
  const matchingEarthOnlyPalace = page.locator(".dunjia-palace").filter({ hasText: "乾6" });
  await expect(matchingEarthOnlyPalace).toContainText("地丁");
  await expect(matchingEarthOnlyPalace.locator(".dunjia-day-stem-marker")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const palaceEight = page.locator(".dunjia-palace").filter({ hasText: "艮8" });
  await palaceEight.click();
  await expect(palaceEight).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#dunjia-palace-detail")).toContainText("四害");
  await palaceEight.click();
  await expect(palaceEight).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#dunjia-palace-detail")).toHaveCount(0);

  const gates = page.locator("details.dunjia-gates-card");
  await expect(gates).not.toHaveAttribute("open", "");
  await page.getByText("天门地户 · 出行辅助", { exact: true }).click();
  await expect(page.locator(".dunjia-gate-item")).toHaveCount(7);

  await page.reload();
  await expect(page.getByRole("heading", { name: "阴遁5局" })).toBeVisible();
  await expect(page.locator(".interpretation-entry")).toHaveCount(0);
  await expect(page.locator(".dunjia-palace")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
