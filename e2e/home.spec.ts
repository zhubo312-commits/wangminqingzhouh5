import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath =
  configuredBasePath === "/"
    ? ""
    : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const homePathname = basePath || "/";

const response = {
  date: "2026-08-10",
  weekday: "星期一",
  calendar: {
    lunarYear: "丙午年",
    lunarMonth: "六月",
    lunarDay: "廿八",
    zodiac: "马",
    solarTerm: null,
  },
  guidance: {
    text: "心静则事明，今日宜先理清轻重，再从容行动。",
    suitable: ["静心", "学习", "整理"],
    avoid: ["急躁", "冲动"],
  },
  links: {
    interpretation: "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
    learning: "https://learning.example/lead",
    question: "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
  },
};

const areaResponse = [
  {
    label: "北京市",
    code: "1101000",
    children: [{ label: "东城", code: "110101", children: [] }],
  },
  { label: "其他地区", code: "999999", children: [] },
];

const pillar = (
  key: "year" | "month" | "day" | "hour",
  label: string,
  stem: string,
  branch: string,
) => ({
  key,
  label,
  stem,
  branch,
  stemElement: "火",
  branchElement: "木",
  tenGod: key === "day" ? "元男" : "偏印",
  hiddenStems: [{ stem: "甲", element: "木", tenGod: "偏印" }],
  growth: "长生",
  selfSeat: "帝旺",
  naYin: "炉中火",
  voidBranch: "戌亥",
  shenSha: ["天乙贵人"],
});

function chartResponse(name: string) {
  return {
    profile: {
      name,
      gender: "male",
      birthDateTime: "1990-01-01 12:00",
      lunarDate: "一九八九年腊月初五日午时",
      area: "北京市东城",
      areaCode: "110101",
      chineseZodiac: "蛇",
      zodiac: "摩羯",
    },
    basicFacts: {
      benMingFo: "普贤菩萨",
      taiYuan: "丁卯",
      taiYuanNaYin: "炉中火",
      mingGong: "乙亥",
      mingGongNaYin: "山头火",
      duiChong: "猴",
      sanSha: "北",
      wenChangWei: "西",
      prevSolarTerm: "1989-12-22 05:22:00 冬至",
      nextSolarTerm: "1990-01-05 22:33:14 小寒",
    },
    pillars: [
      pillar("year", "年柱", "己", "巳"),
      pillar("month", "月柱", "丙", "子"),
      pillar("day", "日柱", "丙", "寅"),
      pillar("hour", "时柱", "甲", "午"),
    ],
    attention: { heavenlyStems: ["甲己合土"], earthlyBranches: ["子午相冲"] },
    shenShaDescriptions: {},
    fortune: {
      startSolar: "1998-05-01 12:00:00",
      startDescription: "出生后8年4月5天20时起运",
      changeDescription: "逢戊、癸年，立夏后1天交大运",
      periods: [
        {
          index: 1,
          startYear: 1998,
          endYear: 2007,
          startAge: 9,
          endAge: 18,
          ganZhi: "乙亥",
          tenGods: ["正印", "七杀"],
          growth: "绝",
          hiddenStems: "壬,甲",
          hiddenStemTenGods: ["七杀", "偏印"],
          wealthStrong: false,
          heavenlyStemAttention: ["甲己合土"],
          earthlyBranchAttention: ["巳亥相冲"],
          shenSha: ["天乙贵人"],
          years: [
            {
              index: 0,
              year: 1998,
              age: 9,
              ganZhi: "戊寅",
              voidBranch: "申酉",
              tenGods: ["食神", "偏印"],
              hiddenStems: "甲,丙,戊",
              hiddenStemTenGods: ["偏印", "比肩", "食神"],
              wealthStrong: false,
              heavenlyStemAttention: ["甲己合土"],
              earthlyBranchAttention: ["寅巳相害"],
              shenSha: ["国印"],
            },
          ],
        },
      ],
    },
    strength: {
      legacyScore: 52,
      samePartyScore: 350,
      otherPartyScore: 260,
      level: "日主偏旺，身强",
      pattern: "扶抑格，劫比主导的偏旺格。",
      summary: "此命主乾造元男，丙火日主，日主偏旺，身强。",
      favorableGod: "首选食伤，次选财才，再次官杀。",
      favorableElements: ["土", "金", "水"],
      relationScores: { 食伤: 90, 印枭: 110, 财才: 20, 官杀: 150, 劫比: 240 },
    },
  };
}

const paipanRef = `pp_${"a".repeat(32)}`;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/home", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
  });
  await page.route("**/api/v1/events", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
  await page.route("**/api/v1/paipan/areas", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(areaResponse) });
  });
  await page.route("**/api/v1/paipan/bazi/resolve-birth", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [{ id: "1990-01-01 12:00", solarDateTime: "1990-01-01 12:00", label: "1990-01-01 12:00（阳历）" }],
        sect: 2,
      }),
    });
  });
  await page.route("**/api/v1/paipan/bazi/chart", async (route) => {
    const request = route.request().postDataJSON() as { name: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...chartResponse(request.name),
        paipan_ref: paipanRef,
        expiresAt: "2026-08-11T12:00:00.000Z",
      }),
    });
  });
  await page.route("**/api/v1/paipan/bazi/context", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: "guoxue.paipan.bazi.v1",
        chartType: "shengping_zishi",
        paipan_ref: paipanRef,
        generatedAt: "2026-08-11T10:00:00.000Z",
        expiresAt: "2026-08-11T12:00:00.000Z",
        chartRequest: {
          name: "",
          gender: "male",
          birthDateTime: "1990-01-01 12:00",
          areaCode: "110101",
          useTrueSolarTime: false,
        },
        chart: chartResponse(""),
      }),
    });
  });
  await page.route("**/api/v1/paipan/bazi/flow-months", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        year: 1998,
        months: [{
          index: 1,
          monthName: "正月",
          ganZhi: "甲寅",
          solarTermName: "立春",
          solarTermDateTime: "1998-02-04 08:56:00",
          tenGods: ["偏印", "偏印"],
          hiddenStems: "甲,丙,戊",
          hiddenStemTenGods: ["偏印", "比肩", "食神"],
          heavenlyStemAttention: ["甲己合土"],
          earthlyBranchAttention: ["寅巳相害"],
          shenSha: ["国印"],
        }],
      }),
    });
  });
});

test("renders the complete mobile home without horizontal overflow", async ({ page }) => {
  await page.goto(appPath("/"));

  await expect(page.getByRole("region", { name: "今日指引" })).toBeVisible();
  await expect(page.locator(".section-seal")).toHaveText("引");
  await expect(page.getByText("今日指引", { exact: true })).toHaveCount(0);
  expect(
    await page.locator(".today-card").evaluate((element) =>
      Math.round(element.getBoundingClientRect().height),
    ),
  ).toBeLessThanOrEqual(240);
  await expect(page.getByRole("link", { name: /专业排盘/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /国心解读/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /学习资料/ })).toBeVisible();
  const questionComposer = page.getByRole("link", { name: /问问题/ });
  await expect(questionComposer).toBeVisible();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
  await expect(page.getByRole("link", { name: /专业排盘/ })).toHaveAttribute(
    "href",
    appPath("/paipan"),
  );
  await expect(questionComposer).toHaveAttribute("href", response.links.question);
  expect(
    await questionComposer.evaluate((element) =>
      window.getComputedStyle(element.parentElement!).position,
    ),
  ).toBe("fixed");
});

test("opens the internal eleven-item chart menu without horizontal overflow", async ({ page }) => {
  await page.goto(appPath("/"));
  await page.getByRole("link", { name: /专业排盘/ }).click();

  await expect(page).toHaveURL(/\/paipan$/);
  const navigation = page.getByRole("navigation", { name: "排盘方式" });
  await expect(navigation.locator(":scope > *")).toHaveCount(11);
  await expect(page.getByRole("link", { name: "生平子时" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "遁甲学" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "决策学" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "阴盘决策" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "梅花学" })).toHaveCount(1);
  await expect(navigation.locator('[aria-disabled="true"]')).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);

  await page.getByRole("button", { name: "返回国学首页" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(homePathname);
});

test("completes the in-session Shengping Zishi flow and preserves the form on back", async ({ page }) => {
  await page.goto(appPath("/"));
  await page.getByRole("link", { name: /专业排盘/ }).click();
  await page.getByRole("link", { name: "生平子时" }).click();
  await expect(page).toHaveURL(/\/paipan\/shengping-zishi$/);
  await expect(page.getByRole("heading", { name: "填写出生信息" })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 700));
  await expect.poll(() => page.locator(".page-header").evaluate((header) => Math.round(header.getBoundingClientRect().top))).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  const areaPicker = page.getByRole("button", { name: "选择出生地区" });
  await expect(areaPicker).toContainText("北京市 / 东城");
  await areaPicker.click();
  await expect(page.getByRole("dialog", { name: "选择出生地区" }).getByRole("listbox")).toHaveCount(3);
  await page.getByRole("dialog", { name: "选择出生地区" }).getByRole("button", { name: "确定" }).click();

  await page.getByRole("button", { name: "开始排盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/shengping-zishi\/result$/);
  await expect(page.getByRole("heading", { name: "同修" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /四柱命盘/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /十年大运/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /旺衰参考/ })).toBeVisible();
  await expect(page.getByLabel("当前为乙亥大运，1998至2007年，9至18岁")).toContainText("乙亥大运");
  await expect(page.getByLabel("当前为乙亥大运，1998至2007年，9至18岁")).toContainText("1998–2007年 · 9–18岁");
  await expect(page.getByLabel("当前为戊寅流年，1998年，9岁")).toContainText("戊寅流年");
  await expect(page.getByLabel("当前为戊寅流年，1998年，9岁")).toContainText("1998年 · 9岁");
  await expect(page.getByRole("button", { name: /甲寅/ })).toBeVisible();
  await expect(page.locator(".profile-grid .info-value-primary").filter({ hasText: "一九八九年" })).toBeVisible();
  await expect(page.locator(".profile-grid .info-value-secondary").filter({ hasText: "腊月初五日·午时" })).toBeVisible();
  await expect(page.locator(".facts-grid .solar-term-name")).toHaveCount(2);
  await expect(page.locator(".facts-grid .info-value-secondary").filter({ hasText: "05:22·冬至" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.locator(".page-header").evaluate((header) => Math.round(header.getBoundingClientRect().top))).toBe(0);
  for (const selector of [".horizontal-selector", ".year-selector", ".month-selector"]) {
    await expect(page.locator(selector)).toHaveCSS("display", "grid");
    expect(await page.locator(selector).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  for (const groupName of ["大运选择", "流年选择", "流月选择"]) {
    const selectionGroup = page.getByRole("group", { name: groupName });
    const activeButton = selectionGroup.locator("button.active").first();
    await expect(selectionGroup.locator(".selection-bubble")).toHaveCount(1);
    await activeButton.click();
    await expect(activeButton).toHaveAttribute("aria-expanded", "false");
    await expect(selectionGroup.locator(".selection-bubble")).toHaveCount(0);
    await activeButton.click();
    await expect(activeButton).toHaveAttribute("aria-expanded", "true");
    await expect(selectionGroup.locator(".selection-bubble")).toHaveCount(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.reload();
  await expect(page.getByRole("heading", { name: "同修" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /四柱命盘/ })).toBeVisible();

  await page.getByRole("button", { name: "返回生平子时表单" }).click();
  await expect(page.locator('input[placeholder*="未填写时"]')).toHaveValue("");
  await page.getByRole("button", { name: "返回排盘导航" }).click();
  await page.getByRole("button", { name: "返回国学首页" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(homePathname);
});

test("supports all three birth modes and requires a four-pillar candidate choice", async ({ page }) => {
  await page.unroute("**/api/v1/paipan/bazi/resolve-birth");
  await page.route("**/api/v1/paipan/bazi/resolve-birth", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      mode: "fourPillars",
      pillars: { year: "己亥", month: "丙子", day: "己卯", hour: "甲子" },
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [
          { id: "1959-12-23 00:00", solarDateTime: "1959-12-23 00:00", label: "1959-12-23 00:00（阳历）" },
          { id: "2019-12-08 00:00", solarDateTime: "2019-12-08 00:00", label: "2019-12-08 00:00（阳历）" },
        ],
        sect: 2,
      }),
    });
  });

  await page.goto(appPath("/paipan/shengping-zishi"));
  await expect(page.getByText("阳历日期与时间", { exact: true })).toHaveCount(0);
  await expect(page.getByText("阴历日期与时间", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/23 点晚子时/)).toHaveCount(0);
  const solarDatePicker = page.getByRole("button", { name: "选择阳历日期" });
  const solarTimePicker = page.getByRole("button", { name: "选择阳历时间" });
  await expect(solarDatePicker).toBeVisible();
  await expect(solarTimePicker).toBeVisible();
  await solarDatePicker.click();
  await expect(page.getByRole("dialog", { name: "选择阳历出生日期" }).getByRole("listbox")).toHaveCount(3);
  await page.getByRole("dialog", { name: "选择阳历出生日期" }).getByRole("button", { name: "取消" }).click();
  await solarTimePicker.click();
  await expect(page.getByRole("dialog", { name: "选择阳历出生时间" }).getByRole("listbox")).toHaveCount(2);
  await page.getByRole("dialog", { name: "选择阳历出生时间" }).getByRole("button", { name: "取消" }).click();

  await page.getByRole("tab", { name: "阴历" }).click();
  const lunarDatePicker = page.getByRole("button", { name: "选择阴历日期" });
  const lunarTimePicker = page.getByRole("button", { name: "选择阴历时间" });
  await expect(lunarDatePicker).toBeVisible();
  await expect(lunarTimePicker).toBeVisible();
  await lunarDatePicker.click();
  const lunarDateDialog = page.getByRole("dialog", { name: "选择阴历出生日期" });
  await expect(lunarDateDialog.getByRole("listbox")).toHaveCount(3);
  await expect(lunarDateDialog.getByRole("listbox", { name: "月滚轮" }).getByRole("option", { name: "腊月（12）", exact: true })).toBeVisible();
  await expect(lunarDateDialog.getByRole("listbox", { name: "日滚轮" }).getByRole("option", { name: "初五（5）", exact: true })).toBeVisible();
  await expect(lunarDateDialog.getByRole("button", { name: "闰月" })).toBeVisible();
  await lunarDateDialog.getByRole("button", { name: "取消" }).click();
  await lunarTimePicker.click();
  await expect(page.getByRole("dialog", { name: "选择阴历出生时间" }).getByRole("listbox")).toHaveCount(2);
  await expect(page.getByRole("dialog", { name: "选择阴历出生时间" }).getByRole("option", { name: "12（午时）", exact: true })).toBeVisible();
  await page.getByRole("dialog", { name: "选择阴历出生时间" }).getByRole("button", { name: "取消" }).click();

  await page.getByRole("tab", { name: "四柱反查" }).click();
  await page.getByRole("button", { name: "选择四柱" }).click();
  const pillarDialog = page.getByRole("dialog", { name: "滚动选择四柱" });
  await expect(pillarDialog.getByRole("listbox")).toHaveCount(4);
  await pillarDialog.getByRole("listbox", { name: "年柱滚轮" }).getByRole("option", { name: "己亥", exact: true }).click();
  await pillarDialog.getByRole("listbox", { name: "月柱滚轮" }).getByRole("option", { name: "丙子", exact: true }).click();
  await pillarDialog.getByRole("listbox", { name: "日柱滚轮" }).getByRole("option", { name: "己卯", exact: true }).click();
  await pillarDialog.getByRole("listbox", { name: "时柱滚轮" }).getByRole("option", { name: "甲子", exact: true }).click();
  for (let index = 0; index < 4; index += 1) {
    const listbox = pillarDialog.getByRole("listbox").nth(index);
    await expect.poll(async () => listbox.evaluate((element) => {
      const selected = element.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!selected) return Number.POSITIVE_INFINITY;
      const viewportRect = element.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      return Math.abs(
        selectedRect.top + selectedRect.height / 2 - (viewportRect.top + viewportRect.height / 2),
      );
    })).toBeLessThanOrEqual(1);
  }
  await pillarDialog.getByRole("button", { name: "确定" }).click();

  await page.getByRole("button", { name: "开始排盘" }).click();
  await expect(page.getByRole("heading", { name: "请选择对应的阳历时间" })).toBeVisible();
  await expect(page.locator(".candidate-list button")).toHaveCount(2);
  await page.getByRole("button", { name: "2019-12-08 00:00（阳历）" }).click();
  await expect(page).toHaveURL(/\/paipan\/shengping-zishi\/result$/);
});

test("shows a recoverable state after directly refreshing the result route", async ({ page }) => {
  await page.goto(appPath("/paipan/shengping-zishi/result"));
  await expect(page.getByText("本次排盘信息已失效")).toBeVisible();
  await expect(page.getByRole("button", { name: "重新排盘" })).toBeVisible();
});
