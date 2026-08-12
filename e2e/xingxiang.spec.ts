import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"x".repeat(32)}`;
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const names = ["交友", "迁移", "疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄"] as const;
const palaceNames = branches.map((branch, index) => ({ branch, name: names[index]! }));
const transformations = [{ transformation: "禄", star: "巨门" }, { transformation: "权", star: "太阳" }, { transformation: "科", star: "文曲" }, { transformation: "忌", star: "文昌" }] as const;
const annuals = Array.from({ length: 10 }, (_, index) => ({ age: 5 + index, year: 1993 + index, ganZhi: ["癸酉", "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午"][index]!, palaceNames, transformations }));
const chart = {
  profile: { name: "测试", gender: "female", genderLabel: "女", yinYangGender: "阴女", solarDateTime: "1990-01-01 12:00", lunarDate: "一九八九年腊月初五日午时", fiveElementsBureau: "土五局", pillars: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" } },
  palaces: branches.map((branch, index) => ({ branch, name: names[index]!, heavenlyStem: ["丙", "丁", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"][index]!, bodyPalace: branch === "未", zodiacPalace: false, originPalace: branch === "巳", stars: [{ name: ["破军", "天机", "紫微", "太阴", "贪狼", "巨门", "廉贞", "天梁", "七杀", "天同", "武曲", "太阳"][index]!, category: "major", brightness: index % 2 ? "旺" : "庙", natalTransformation: index === 4 ? "权" : null }, { name: ["台辅", "天魁", "天府", "左辅", "文昌", "地劫", "天相", "擎羊", "天钺", "火星", "文曲", "右弼"][index]!, category: "support", brightness: "", natalTransformation: null }], selfTransformations: index === 0 ? [{ transformation: "忌", star: "廉贞", inward: false }] : index === 1 ? [{ transformation: "科", star: "天机", inward: true }] : [] })),
  periods: Array.from({ length: 12 }, (_, index) => ({ ganZhi: ["辛未", "庚午", "己巳", "戊辰", "丁卯", "丙寅", "乙丑", "甲子", "癸亥", "壬戌", "辛酉", "庚申"][index]!, startAge: 5 + index * 10, endAge: 14 + index * 10, startYear: 1993 + index * 10, endYear: 2002 + index * 10, palaceNames, transformations, annuals: annuals.map((annual) => ({ ...annual, age: annual.age + index * 10, year: annual.year + index * 10 })) })),
};

test("completes the Xingxiang form, period/year interaction, enlarged chart and restore without overflow", async ({ page }) => {
  let latestRequest = { name: "测试", gender: "female", birthDateTime: "1990-01-01 12:00", school: "flying" };
  await page.route("**/api/v1/paipan/xingxiang/chart", async (route) => {
    latestRequest = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...chart, profile: { ...chart.profile, name: latestRequest.name, gender: latestRequest.gender, genderLabel: latestRequest.gender === "female" ? "女" : "男", yinYangGender: latestRequest.gender === "female" ? "阴女" : "阴男", solarDateTime: latestRequest.birthDateTime }, paipan_ref: paipanRef, expiresAt: "2026-08-13T12:00:00.000Z" }) });
  });
  await page.route("**/api/v1/paipan/xingxiang/context", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ schemaVersion: "guoxue.paipan.xingxiang.v1", chartType: "xingxiang", paipan_ref: paipanRef, generatedAt: "2026-08-12T10:00:00.000Z", expiresAt: "2026-08-13T12:00:00.000Z", chartRequest: latestRequest, chart: { ...chart, profile: { ...chart.profile, name: latestRequest.name, gender: latestRequest.gender, genderLabel: latestRequest.gender === "female" ? "女" : "男", yinYangGender: latestRequest.gender === "female" ? "阴女" : "阴男", solarDateTime: latestRequest.birthDateTime } } }) }));

  await page.goto(appPath("/paipan/xingxiang"));
  await expect(page.getByRole("heading", { name: "出生信息" })).toBeVisible();
  await page.getByPlaceholder("请输入姓名").fill("测试");
  await page.getByRole("button", { name: "女", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole("button", { name: "开始排盘" }).click();

  await expect(page).toHaveURL(/\/paipan\/xingxiang\/result$/);
  expect(latestRequest).toMatchObject({ name: "测试", gender: "female", school: "flying" });
  await expect(page.locator(".xingxiang-palace-grid").first().locator(":scope > button")).toHaveCount(12);
  await expect(page.locator(".xingxiang-periods > button")).toHaveCount(12);
  await expect(page.locator(".xingxiang-annuals > button")).toHaveCount(10);
  await page.locator(".xingxiang-periods > button").nth(1).click();
  await expect(page.locator(".xingxiang-periods > button").nth(1)).toHaveClass(/active/);
  await expect(page.locator(".xingxiang-annuals > button").first()).toHaveClass(/active/);
  await page.locator(".xingxiang-annuals > button").nth(2).click();
  await expect(page.getByText(/2005年乙亥流年/)).toBeVisible();
  await page.locator(".xingxiang-palace-grid").first().locator(":scope > button").first().click();
  await expect(page.locator(".xingxiang-palace-detail h3")).toHaveText("交友");
  await page.getByRole("button", { name: "放大查看" }).click();
  await expect(page.getByRole("dialog", { name: "放大查看十二宫" })).toBeVisible();
  await expect(page.getByRole("dialog").locator(".xingxiang-palace-grid > button")).toHaveCount(12);
  await page.getByRole("button", { name: "关闭" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.reload();
  await expect(page.locator(".xingxiang-palace-grid").first().locator(":scope > button")).toHaveCount(12);
  await expect(page.getByRole("heading", { name: /测试 · 阴女/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
