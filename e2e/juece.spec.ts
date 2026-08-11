import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/"
  ? ""
  : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";

const areas = [{
  label: "北京市",
  code: "1100000",
  children: [{ label: "朝阳", code: "110105", children: [] }],
}];

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

function chart(clockDateTime: string) {
  return {
    overview: {
      method: "转盘 · 寄坤宫 · 拆补 · 时空",
      clockDateTime,
      effectiveDateTime: clockDateTime,
      timeMode: "standard" as const,
      areaCode: null,
      areaName: null,
      trueSolarTime: null,
      lunarDate: "二〇二六年六月廿九日",
      pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "戊申" },
      voidBranches: { year: "寅卯", month: "辰巳", day: "子丑", hour: "寅卯" },
      selectedVoidBranches: "寅卯",
      previousSolarTerm: { name: "立秋", dateTime: "2026-08-07 19:42:40" },
      nextSolarTerm: { name: "处暑", dateTime: "2026-08-23 10:18:46" },
      panStyle: "rotating" as const,
      panStyleLabel: "转盘",
      bureauMethod: "chai_bu" as const,
      bureauLabel: "拆补",
      directionRule: null,
      centerPalaceMethod: "kun" as const,
      dunType: "阴" as const,
      juNumber: 5,
      xunShou: "甲辰壬",
      chiefStar: { name: "天蓬", palace: 2 },
      chiefDoor: { name: "休门", palace: 6 },
      horse: { branch: "寅", palace: 8 },
    },
    palaces: palaceNames.map(([index, trigram, direction, element]) => ({
      index,
      trigram,
      direction,
      element,
      heavenPlate: {
        stem: index === 5 ? null : ["己", "壬", "辛", "丙", "", "庚", "丁", "癸", "乙"][index - 1],
        star: index === 5 ? null : ["天辅", "天蓬", "天芮", "天柱", "", "天冲", "天任", "天英", "天心"][index - 1],
        door: index === 5 ? null : ["生门", "惊门", "杜门", "景门", "", "休门", "开门", "伤门", "死门"][index - 1],
        deity: index === 5 ? null : ["玄武", "值符", "六合", "太阴", "", "九地", "九天", "白虎", "螣蛇"][index - 1],
      },
      earthPlate: {
        stem: ["壬", "辛", "庚", "己", "戊", "乙", "丙", "丁", "癸"][index - 1],
        star: ["天蓬", "天芮", "天冲", "天辅", "天禽", "天心", "天柱", "天任", "天英"][index - 1],
        door: index === 5 ? null : ["休门", "死门", "伤门", "杜门", "", "开门", "惊门", "生门", "景门"][index - 1],
        deity: null,
      },
      attached: index === 2 ? { earthStem: "戊", earthStar: "天禽", heavenStem: null, heavenStar: null } : null,
      hiddenGanZhi: null,
      isVoid: index === 3 || index === 8,
      isHorse: index === 8,
      isChief: index === 2,
      isChiefDoor: index === 6,
    })),
  };
}

test("completes, switches and restores the reference-aligned decision chart without overflow", async ({ page }) => {
  const received: Array<{ chartDateTime: string }> = [];
  let latestRequest: Record<string, unknown> | null = null;
  let latestChart = chart("2026-08-11 16:00");
  let referenceIndex = 0;

  await page.route("**/api/v1/paipan/areas", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(areas),
  }));
  await page.route("**/api/v1/paipan/juece/chart", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown> & { chartDateTime: string };
    received.push({ chartDateTime: body.chartDateTime });
    latestRequest = body;
    latestChart = chart(body.chartDateTime);
    referenceIndex += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...latestChart,
        paipan_ref: `pp_${String(referenceIndex).padStart(32, "a")}`,
        expiresAt: "2026-08-11T20:00:00.000Z",
      }),
    });
  });
  await page.route("**/api/v1/paipan/juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.shijia_juece.v1",
      chartType: "shijia_juece",
      paipan_ref: `pp_${String(referenceIndex).padStart(32, "a")}`,
      generatedAt: "2026-08-11T10:00:00.000Z",
      expiresAt: "2026-08-11T20:00:00.000Z",
      chartRequest: latestRequest,
      chart: latestChart,
    }),
  }));

  await page.goto(appPath("/paipan/juece"));
  await expect(page.getByText("转盘固定规则")).toBeVisible();
  await expect(page.getByRole("heading", { name: "起盘条件" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "盘式与定局" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "标记与寄宫" })).toBeVisible();

  await page.getByRole("tab", { name: "阴历" }).click();
  await expect(page.getByRole("tab", { name: "阴历" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "阳历" }).click();

  await page.getByRole("button", { name: "真太阳时" }).click();
  await expect(page.getByText("地区只用于本次时间校正")).toBeVisible();
  await page.getByRole("button", { name: "标准时间" }).click();
  await expect(page.getByText("地区只用于本次时间校正")).toHaveCount(0);

  await page.getByRole("button", { name: "飞盘", exact: true }).click();
  await expect(page.getByText("飞盘顺逆规则")).toBeVisible();
  await expect(page.getByRole("button", { name: "寄坤宫" })).toHaveCount(0);
  await page.getByRole("button", { name: "手工定局" }).click();
  await expect(page.getByText("阴阳遁")).toBeVisible();
  await expect(page.locator(".juece-number-grid button")).toHaveCount(9);
  await page.getByRole("button", { name: "拆补" }).click();
  await page.getByRole("button", { name: "转盘", exact: true }).click();
  await expect(page.getByText("转盘固定规则")).toBeVisible();
  await expect(page.getByText("时空 · 寄坤宫")).toBeVisible();
  await expect(page.getByRole("button", { name: "手工定局" })).toHaveCount(0);

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.locator("form").evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page).toHaveURL(/\/paipan\/juece\/result$/);
  expect(received).toHaveLength(1);
  await expect(page.getByRole("heading", { name: "阴遁5局" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "九宫主盘" })).toBeVisible();
  await expect(page.locator(".juece-palace")).toHaveCount(9);
  await expect(page.locator(".interpretation-entry")).toHaveCount(0);
  await expect(page.getByText("智能老师", { exact: false })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const kunPalace = page.locator(".juece-palace").filter({ hasText: "坤2" });
  await kunPalace.click();
  await expect(page.locator("#juece-palace-detail")).toContainText("中宫寄宫");
  await expect(page.locator("#juece-palace-detail")).toContainText("值符");

  const initialTime = received[0]!.chartDateTime;
  await page.getByRole("button", { name: "下一时辰" }).click();
  await expect.poll(() => received.length).toBe(2);
  expect(Date.parse(received[1]!.chartDateTime.replace(" ", "T") + ":00Z")
    - Date.parse(initialTime.replace(" ", "T") + ":00Z")).toBe(2 * 60 * 60 * 1000);
  await expect(page.locator(".juece-hour-switch > span")).toHaveText(received[1]!.chartDateTime);

  await page.reload();
  await expect(page.getByRole("heading", { name: "阴遁5局" })).toBeVisible();
  await expect(page.locator(".juece-palace")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("keeps the current chart when an hour switch fails", async ({ page }) => {
  let attempts = 0;
  const initialRequest = {
    chartDateTime: "2026-08-11 16:00",
    time: { mode: "standard" },
    pan: { style: "rotating", centerPalaceMethod: "kun" },
    bureau: { method: "chai_bu" },
    voidBasis: "hour",
  };
  await page.addInitScript(({ ref }) => {
    window.sessionStorage.setItem("guoxue.paipan.shijia_juece_ref.v1", ref);
  }, { ref: `pp_${"z".repeat(32)}` });
  await page.route("**/api/v1/paipan/juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.shijia_juece.v1",
      chartType: "shijia_juece",
      paipan_ref: `pp_${"z".repeat(32)}`,
      generatedAt: "2026-08-11T10:00:00.000Z",
      expiresAt: "2026-08-11T20:00:00.000Z",
      chartRequest: initialRequest,
      chart: chart(initialRequest.chartDateTime),
    }),
  }));
  await page.route("**/api/v1/paipan/juece/chart", (route) => {
    attempts += 1;
    return route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({ detail: "排盘服务暂时不可用" }),
    });
  });

  await page.goto(appPath("/paipan/juece/result"));
  await expect(page.locator(".juece-hour-switch > span")).toHaveText("2026-08-11 16:00");
  await page.getByRole("button", { name: "下一时辰" }).click();
  await expect(page.getByRole("alert")).toContainText("当前盘未改变");
  await expect(page.locator(".juece-hour-switch > span")).toHaveText("2026-08-11 16:00");
  await page.getByRole("button", { name: "重试" }).click();
  await expect.poll(() => attempts).toBe(2);
});

test("clears an expired reference and returns to re-charting", async ({ page }) => {
  const reference = `pp_${"e".repeat(32)}`;
  await page.addInitScript(({ ref }) => {
    window.sessionStorage.setItem("guoxue.paipan.shijia_juece_ref.v1", ref);
  }, { ref: reference });
  await page.route("**/api/v1/paipan/juece/context", (route) => route.fulfill({
    status: 410,
    contentType: "application/problem+json",
    body: JSON.stringify({ detail: "排盘引用已过期" }),
  }));
  await page.route("**/api/v1/paipan/areas", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(areas),
  }));

  await page.goto(appPath("/paipan/juece/result"));
  await expect(page.getByRole("heading", { name: "本次决策盘已失效" })).toBeVisible();
  expect(await page.evaluate(() => window.sessionStorage.getItem(
    "guoxue.paipan.shijia_juece_ref.v1",
  ))).toBeNull();
  await page.getByRole("button", { name: "重新排盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/juece$/);
});
