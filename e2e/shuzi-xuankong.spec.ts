import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"n".repeat(32)}`;

const shuziChart = {
  overview: { name: "测试者", gender: "male", genderLabel: "男", solarDateTime: "1990-01-01 12:00", lunarDate: "一九八九年腊月初五日午时", chineseZodiac: "蛇" },
  innate: {
    year: { numbers: [6], yinYang: ["阴"], elements: ["火"] },
    month: { numbers: [12], yinYang: ["阳"], elements: ["水"] },
    day: { numbers: [5], yinYang: ["阴"], elements: ["木"] },
    hour: { numbers: [7], yinYang: ["阴"], elements: ["火"] },
  },
  acquired: {
    year: { numbers: [12], yinYang: ["阳"], elements: ["水"] },
    month: { numbers: [6], yinYang: ["阴"], elements: ["火"] },
    day: { numbers: [11], yinYang: ["阳"], elements: ["金"] },
    hour: { numbers: [1], yinYang: ["阳"], elements: ["水"] },
  },
  interpretations: [{ combination: "6-12/12-6", position: "年月", category: "绝冲数组", description: "从小背乡离家，外出求学或创业，一生可能多次搬家。", occurrences: 2 }],
};

const trigrams = ["坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"];
const directions = ["北方", "西南", "东方", "东南", "中央", "西北", "西方", "东北", "南方"];
const elements = ["水", "土", "木", "木", "土", "金", "金", "土", "火"];
const stars = ["贪狼星", "巨门星", "禄存星", "文曲星", "廉贞星", "武曲星", "破军星", "左辅星", "右弼星"];
const xuankongChart = {
  overview: { chartDateTime: "2024-02-04 12:00", lunarDate: "癸卯年乙丑月戊戌日午时", fortunePeriod: 9, fortuneLabel: "九运", orientation: "子山午向", method: "base", methodLabel: "下盘", note: "书房" },
  directions: ["子山", "艮", "震", "巽", "午向", "坤", "兑", "乾"],
  palaces: Array.from({ length: 9 }, (_, index) => ({
    index: index + 1, trigram: trigrams[index], direction: directions[index], element: elements[index], star: stars[index],
    fortuneStar: ((index + 4) % 9) + 1, mountainStar: 9 - index, facingStar: index + 1,
    annualStar: ((index + 8) % 9) + 1, monthlyStar: ((index + 1) % 9) + 1, dailyStar: ((index + 3) % 9) + 1, hourlyStar: ((index + 5) % 9) + 1,
    mountainPosition: index === 0 ? "子" : null, facingPosition: index === 8 ? "午" : null,
    interpretations: { combination: "山向组合解读", fortune: "运星解读", mountain: "山星解读", facing: "向星解读", annual: "年星解读" },
  })),
};

async function noOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/paipan/shuzi-guilv/chart", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...shuziChart, paipan_ref: paipanRef, expiresAt: "2030-01-01T00:00:00.000Z" }) }));
  await page.route("**/api/v1/paipan/xuankong-feixing/chart", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...xuankongChart, paipan_ref: paipanRef, expiresAt: "2030-01-01T00:00:00.000Z" }) }));
});

test("completes the digital-pattern mobile flow", async ({ page }) => {
  await page.goto(appPath("/paipan/shuzi-guilv"));
  await page.getByPlaceholder("请输入姓名").fill("测试者");
  await noOverflow(page);
  await page.getByRole("button", { name: "开始排盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/shuzi-guilv\/result$/);
  await expect(page.getByRole("heading", { name: "测试者的数字盘" })).toBeVisible();
  await expect(page.getByText("6-12/12-6")).toBeVisible();
  await expect(page.getByText("出现 2 次")).toBeVisible();
  await noOverflow(page);
});

test("completes the flying-star mobile flow and opens a palace", async ({ page }) => {
  await page.goto(appPath("/paipan/xuankong-feixing"));
  await noOverflow(page);
  await page.getByRole("button", { name: "开始飞星排盘" }).click();
  await expect(page).toHaveURL(/\/paipan\/xuankong-feixing\/result$/);
  await expect(page.getByRole("heading", { name: "子山午向" })).toBeVisible();
  await page.locator(".xuankong-palace").filter({ hasText: "坎1" }).click();
  await expect(page.getByText("坎1宫")).toBeVisible();
  await expect(page.getByRole("heading", { name: "年月日时飞星" })).toBeVisible();
  await noOverflow(page);
});
