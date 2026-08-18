import { expect, test, type Page } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"k".repeat(32)}`;
const expiresAt = "2030-01-01T00:00:00.000Z";
const usageReference = {
  recommendationPercent: 95,
  culturePercent: 94,
  genderTendency: 3,
  usageCount: 1000,
  firstCharacterPercent: 84,
  malePercent: 47,
  femalePercent: 53,
  sourceNote: "来源站统计，仅作用字参考。",
};
const reading = (number: number, rating: string) => ({
  number,
  yinYang: number % 2 ? "阳" : "阴",
  rating,
  summary: "福寿圆满，富贵荣誉。",
  categories: "吉祥运",
  foundation: "木星",
  family: "家门余庆",
  health: "健康",
  meaning: "传统含义",
  detail: "完整数理正文",
});
const character = (input: string, pinyin: string, radical: string, strokes: number, element: string, explanation: string, implication: string) => ({
  input,
  simplified: input,
  traditional: input,
  pinyin,
  radical,
  kangxiStrokes: strokes,
  calculationStrokes: strokes,
  element,
  rating: "吉",
  common: true,
  nameUsageClass: "姓名学",
  nameExplanation: explanation,
  namingMeaning: implication,
  namingImplication: implication,
  taboos: null,
  usageReference,
});
const grid = (key: string, label: string, number: number, element: string, rating: string) => ({
  key,
  label,
  number,
  interpretationNumber: number,
  element,
  rating,
  interpretation: reading(number, rating),
});
const chart = {
  dataset: { status: "official", version: "xingming-20260814.r1", dictionaryVersion: "kangxi-cn-20260813.r3", numerologyVersion: "yp-20260813.r1" },
  school: "wuge",
  name: { surname: "李", givenName: "明", fullName: "李明" },
  characters: [
    character("李", "lǐ", "木", 7, "火", "李树，也用于姓氏。", "根基稳固。"),
    character("明", "míng", "日", 8, "水", "明亮，清楚。", "聪慧通达。"),
  ],
  grids: [
    grid("heaven", "天格", 8, "金", "吉"),
    grid("person", "人格", 15, "土", "大吉"),
    grid("earth", "地格", 9, "水", "凶"),
    grid("outer", "外格", 2, "木", "凶"),
    grid("total", "总格", 15, "土", "大吉"),
  ],
  threeTalents: {
    title: "金土水",
    rating: "吉",
    summary: "易达目的。",
    foundationLuck: "基础安定",
    foundationRating: "吉",
    successLuck: "成功顺利",
    successRating: "吉",
    relationships: "人际圆融",
    relationshipsRating: "吉",
    personality: "性情稳健",
    liugeSummary: null,
    liugeRating: null,
  },
  elementRelations: [
    { from: "天格", to: "人格", relation: "相生", summary: "天格 → 人格：相生" },
    { from: "人格", to: "地格", relation: "相克", summary: "人格 → 地格：相克" },
  ],
  score: 68,
  scoreBreakdown: {
    components: [
      { key: "heaven", label: "天格", weightPercent: 20, rawScore: 70, contribution: 14 },
      { key: "earth", label: "地格", weightPercent: 20, rawScore: 70, contribution: 14 },
      { key: "person", label: "人格", weightPercent: 20, rawScore: 90, contribution: 18 },
      { key: "threeTalents", label: "三才", weightPercent: 40, rawScore: 55, contribution: 22 },
    ],
    total: 68,
    note: "仅作传统姓名学参考",
  },
  totalGridDescription: reading(15, "大吉"),
};

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.locator(".kangxi-result-page article, .kangxi-result-page details").evaluateAll((elements) =>
    elements.every((element) => element.scrollWidth <= element.clientWidth),
  )).toBe(true);
}

test("queries Kangxi name characters, keeps a dedicated session, and stays mobile-safe", async ({ page }, testInfo) => {
  let latestRequest = { surname: "李", givenName: "明", school: "wuge" };
  await page.route("**/api/v1/paipan/xingming/chart", async (route) => {
    latestRequest = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...chart, paipan_ref: paipanRef, expiresAt }),
    });
  });
  await page.route("**/api/v1/paipan/xingming/context", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.xingming.v2",
      chartType: "xingming",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-18T03:00:00.000Z",
      expiresAt,
      chartRequest: latestRequest,
      chart,
    }),
  }));

  expect(["mobile-360", "mobile-390", "mobile-430"]).toContain(testInfo.project.name);
  await page.goto(appPath("/paipan"));
  const navigation = page.getByRole("navigation", { name: "排盘方式" });
  await expect(navigation.locator(":scope > *")).toHaveCount(13);
  const guanfuMenuLink = page.getByRole("link", { name: "观复字库" });
  await expect(guanfuMenuLink).toHaveAttribute("href", "https://bqcjh742bk.coze.site/");
  await expect(guanfuMenuLink).toHaveAttribute("target", "_blank");
  await expect(guanfuMenuLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(navigation.locator(":scope > *").last()).toHaveText("观复字库");
  await page.getByRole("link", { name: "康熙字典" }).click();

  await expect(page).toHaveURL(/\/paipan\/kangxi$/);
  await expect(page.getByRole("button", { name: /三才五格|三才六格/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /观复字库/ })).toHaveCount(0);

  await page.getByRole("textbox", { name: "姓名" }).fill("李明");
  await page.getByRole("button", { name: "查询姓名用字" }).click();

  expect(latestRequest).toEqual({ surname: "李", givenName: "明", school: "wuge" });
  await expect(page).toHaveURL(/\/paipan\/kangxi\/result$/);
  await expect(page.getByRole("heading", { name: "李明" })).toBeVisible();
  await expect(page.getByLabel("姓氏 李").getByRole("article")).toHaveCount(1);
  await expect(page.getByLabel("名字 明").getByRole("article")).toHaveCount(1);
  await expect(page.getByLabel("名字用字 明").getByText("康熙笔画")).toBeVisible();
  await expect(page.getByLabel("名字用字 明").getByLabel("五行 水")).toBeVisible();
  await expect(page.getByText("部首 日")).toBeVisible();
  await expect(page.getByText("聪慧通达。")).toBeVisible();
  await expect(page.getByText(/五格数理|六格数理|三才配置|参考分|评分构成/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /观复字库/ })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  expect(await page.evaluate(() => ({
    kangxi: sessionStorage.getItem("guoxue.paipan.kangxi_ref.v1"),
    xingming: sessionStorage.getItem("guoxue.paipan.xingming_ref.v2"),
  }))).toEqual({ kangxi: paipanRef, xingming: null });

  await page.reload();
  await expect(page.getByRole("heading", { name: "李明" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
