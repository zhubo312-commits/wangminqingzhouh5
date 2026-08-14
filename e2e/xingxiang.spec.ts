import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"x".repeat(32)}`;
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const names = ["交友", "迁移", "疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄"] as const;
const palaceNames = branches.map((branch, index) => ({ branch, name: names[index]! }));
const palaceCycle = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"] as const;
const namesForLifePalace = (lifeBranch: (typeof branches)[number]) => {
  const lifeIndex = branches.indexOf(lifeBranch);
  return branches.map((branch, index) => ({ branch, name: palaceCycle[(lifeIndex - index + 12) % 12]! }));
};
const transformations = [{ transformation: "禄", star: "巨门", targetBranch: "巳" }, { transformation: "权", star: "太阳", targetBranch: "亥" }, { transformation: "科", star: "文曲", targetBranch: "戌" }, { transformation: "忌", star: "文昌", targetBranch: "辰" }] as const;
const monthNames = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"] as const;
const monthGanZhi = ["甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥", "甲子", "乙丑"] as const;
const months = branches.map((palaceBranch, index) => ({ monthNumber: index + 1, monthName: monthNames[index]!, ganZhi: monthGanZhi[index]!, palaceBranch }));
const annuals = Array.from({ length: 10 }, (_, index) => ({ age: 5 + index, year: 1993 + index, ganZhi: ["癸酉", "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午"][index]!, palaceNames: namesForLifePalace(branches[index]!), transformations, months }));
const chart = {
  profile: { name: "测试", gender: "female", genderLabel: "女", yinYangGender: "阴女", solarDateTime: "1990-01-01 12:00", lunarDate: "一九八九年腊月初五日午时", fiveElementsBureau: "土五局", pillars: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" } },
  palaces: branches.map((branch, index) => ({ branch, name: names[index]!, heavenlyStem: ["丙", "丁", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"][index]!, bodyPalace: branch === "未", zodiacPalace: false, originPalace: branch === "巳", stars: [{ name: ["破军", "天机", "紫微", "太阴", "贪狼", "巨门", "廉贞", "天梁", "七杀", "天同", "武曲", "太阳"][index]!, category: "major", brightness: index % 2 ? "旺" : "庙", natalTransformation: index === 4 ? "权" : null }, { name: ["台辅", "天魁", "天府", "左辅", "文昌", "地劫", "天相", "擎羊", "天钺", "火星", "文曲", "右弼"][index]!, category: "support", brightness: "", natalTransformation: null }], flyingTransformations: transformations, selfTransformations: index === 0 ? [{ transformation: "忌", star: "廉贞", targetBranch: "午", inward: false, direction: "inward" }] : index === 1 ? [{ transformation: "科", star: "天机", targetBranch: "丑", inward: true, direction: "outward" }] : [] })),
  periods: Array.from({ length: 12 }, (_, index) => ({ ganZhi: ["辛未", "庚午", "己巳", "戊辰", "丁卯", "丙寅", "乙丑", "甲子", "癸亥", "壬戌", "辛酉", "庚申"][index]!, startAge: 5 + index * 10, endAge: 14 + index * 10, startYear: 1993 + index * 10, endYear: 2002 + index * 10, palaceNames, transformations, annuals: annuals.map((annual) => ({ ...annual, age: annual.age + index * 10, year: annual.year + index * 10 })) })),
};

test("completes the Xingxiang form, period/year interaction, enlarged chart and restore without overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let latestRequest = { name: "测试", gender: "female", birthDateTime: "1990-01-01 12:00", school: "flying" };
  await page.route("**/api/v1/paipan/xingxiang/chart", async (route) => {
    latestRequest = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...chart, profile: { ...chart.profile, name: latestRequest.name, gender: latestRequest.gender, genderLabel: latestRequest.gender === "female" ? "女" : "男", yinYangGender: latestRequest.gender === "female" ? "阴女" : "阴男", solarDateTime: latestRequest.birthDateTime }, paipan_ref: paipanRef, expiresAt: "2026-08-13T12:00:00.000Z" }) });
  });
  await page.route("**/api/v1/paipan/xingxiang/context", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ schemaVersion: "guoxue.paipan.xingxiang.v2", chartType: "xingxiang", paipan_ref: paipanRef, generatedAt: "2026-08-12T10:00:00.000Z", expiresAt: "2026-08-13T12:00:00.000Z", chartRequest: latestRequest, chart: { ...chart, profile: { ...chart.profile, name: latestRequest.name, gender: latestRequest.gender, genderLabel: latestRequest.gender === "female" ? "女" : "男", yinYangGender: latestRequest.gender === "female" ? "阴女" : "阴男", solarDateTime: latestRequest.birthDateTime } } }) }));

  await page.goto(appPath("/paipan/xingxiang"));
  await expect(page.getByRole("heading", { name: "出生信息" })).toBeVisible();
  await page.getByPlaceholder("请输入姓名").fill("测试");
  await page.getByRole("button", { name: "女", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole("button", { name: "开始排盘" }).click();

  await expect(page).toHaveURL(/\/paipan\/xingxiang\/result$/);
  expect(latestRequest).toMatchObject({ name: "测试", gender: "female", school: "flying" });
  const temporalGrid = page.getByLabel("运限十二宫星盘");
  await expect(temporalGrid.locator("button")).toHaveCount(12);
  await expect(temporalGrid.locator("button.is-period-life")).toHaveCount(1);
  await expect(temporalGrid.locator(".xingxiang-stars span.is-period-change")).toHaveCount(4);
  const palaceGrid = page.locator(".xingxiang-chart-card .xingxiang-palace-grid");
  const palaceButtons = palaceGrid.locator('button[aria-controls="xingxiang-palace-detail"]');
  await expect(palaceButtons).toHaveCount(12);
  await expect(page.locator(".xingxiang-periods > button")).toHaveCount(12);
  await expect(page.locator(".xingxiang-annuals > button")).toHaveCount(10);
  await expect(page.locator(".xingxiang-annuals > button").first()).not.toHaveClass(/active/);
  await expect(page.locator(".xingxiang-chart-note")).toContainText("未选择流年");
  await expect(page.locator(".xingxiang-chart-card").getByText("正南方", { exact: true })).toBeVisible();
  await expect(page.locator(".xingxiang-chart-card").getByText("正北方", { exact: true })).toBeVisible();
  await page.locator(".xingxiang-periods > button").nth(1).click();
  await expect(page.locator(".xingxiang-periods > button").nth(1)).toHaveClass(/active/);
  await expect(page.locator(".xingxiang-annuals > button")).toHaveCount(10);
  await expect(page.locator(".xingxiang-annuals > button").first()).not.toHaveClass(/active/);
  await page.locator(".xingxiang-annuals > button").nth(2).click();
  await expect(page.locator(".xingxiang-chart-note")).toContainText("2005年乙亥流年");
  await expect(temporalGrid.locator("button.is-annual-life")).toHaveCount(1);
  await expect(temporalGrid.locator(".xingxiang-stars span.is-annual-change")).toHaveCount(4);
  await expect(palaceGrid.locator(".xingxiang-palace-scopes", { hasText: "正月 · 甲寅" })).toHaveCount(1);
  await expect(palaceGrid.locator(".xingxiang-stars em.annual")).toHaveCount(4);
  const annualFocusPath = await palaceGrid.locator(".xingxiang-four-directions path").first().getAttribute("d");
  await palaceButtons.filter({ hasText: "丙子" }).click();
  await expect(page.locator(".xingxiang-palace-detail h3")).toHaveText("交友宫");
  await expect(palaceGrid.locator('.xingxiang-stars span[class*="flying-"]')).toHaveCount(4);
  expect(await palaceGrid.locator(".xingxiang-four-directions path").first().getAttribute("d")).not.toBe(annualFocusPath);
  const zoomAction = page.getByRole("button", { name: "放大查看" });
  const restartAction = page.getByRole("button", { name: "重新排盘" });
  await expect(zoomAction).toHaveAttribute("data-paipan-action", "zoom");
  await expect(restartAction).toHaveAttribute("data-paipan-action", "restart");
  expect(await zoomAction.evaluate((button) => getComputedStyle(button).backgroundColor)).toBe("rgb(178, 77, 52)");
  await zoomAction.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('button[aria-controls="xingxiang-dialog-palace-detail"]')).toHaveCount(12);
  await expect(page.getByRole("button", { name: "关闭放大查看" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(zoomAction).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.reload();
  await expect(page.locator('.xingxiang-chart-card .xingxiang-palace-grid').locator('button[aria-controls="xingxiang-palace-detail"]')).toHaveCount(12);
  await expect(page.getByRole("heading", { name: /测试 · 阴女/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
