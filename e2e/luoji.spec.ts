import { expect, test } from "@playwright/test";

const configuredBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const basePath = configuredBasePath === "/" ? "" : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;
const appPath = (pathname: string) => `${basePath}${pathname}` || "/";
const paipanRef = `pp_${"l".repeat(32)}`;
const originalLines = ["yang", "yin", "yang", "yin", "yang", "yang"] as const;
const changedLines = ["yang", "yang", "yang", "yin", "yang", "yin"] as const;
const deities = ["青龙", "玄武", "白虎", "螣蛇", "勾陈", "朱雀"] as const;
const originalKin = ["父母", "兄弟", "子孙", "兄弟", "官鬼", "父母"] as const;
const originalGz = ["己巳", "己未", "己酉", "丁丑", "丁卯", "丁巳"] as const;
const changedKin = ["兄弟", "子孙", "父母", "父母", "兄弟", "官鬼"] as const;
const changedGz = ["壬戌", "壬申", "壬午", "戊午", "戊辰", "戊寅"] as const;
const element = (value: string) => "巳午".includes(value[1] ?? "") ? "火" : "申酉".includes(value[1] ?? "") ? "金" : "寅卯".includes(value[1] ?? "") ? "木" : "子亥".includes(value[1] ?? "") ? "水" : "土";
const chart = {
  overview: { method: "铜钱摇盘法", question: "项目安排", solarDateTime: "2026-08-11 21:31", lunarDate: "丙午年丙申月丁巳日辛亥时", pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" }, voidBranches: "子丑", coinBacks: "312101" },
  original: { name: "火泽睽", upperTrigram: "离", lowerTrigram: "兑", lines: originalLines, palace: { name: "艮宫", sequence: 5, type: null, element: "土" }, shiLine: 4, yingLine: 1 },
  changed: { name: "天水讼", upperTrigram: "乾", lowerTrigram: "坎", lines: changedLines, palace: { name: "离宫", sequence: 7, type: "游魂", element: "火" }, shiLine: 4, yingLine: 1 },
  lines: originalLines.map((originalLine, index) => ({ position: 6 - index, deity: deities[index], hiddenKin: index === 1 ? "妻财" : null, hiddenStemBranch: index === 1 ? "丙子" : null, originalKin: originalKin[index], originalStemBranch: originalGz[index], originalElement: element(originalGz[index]!), originalLine, isMoving: index === 1 || index === 5, marker: index === 2 ? "世" : index === 5 ? "应" : null, changedKin: changedKin[index], changedStemBranch: changedGz[index], changedElement: element(changedGz[index]!), changedLine: changedLines[index] })),
};

test("covers all three Luoji methods, the six-line result and context restore without overflow", async ({ page }) => {
  let latestRequest: Record<string, unknown> = { chartDateTime: "2026-08-11 21:31", question: "项目安排", mode: "coins", coinBacks: "312101" };
  await page.route("**/api/v1/paipan/luoji/chart", async (route) => {
    latestRequest = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...chart, overview: { ...chart.overview, question: latestRequest.question, solarDateTime: latestRequest.chartDateTime, coinBacks: latestRequest.coinBacks }, paipan_ref: paipanRef, expiresAt: "2026-08-12T12:00:00.000Z" }) });
  });
  await page.route("**/api/v1/paipan/luoji/context", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ schemaVersion: "guoxue.paipan.luoji.v1", chartType: "luoji", paipan_ref: paipanRef, generatedAt: "2026-08-12T10:00:00.000Z", expiresAt: "2026-08-12T12:00:00.000Z", chartRequest: latestRequest, chart: { ...chart, overview: { ...chart.overview, question: latestRequest.question, solarDateTime: latestRequest.chartDateTime, coinBacks: latestRequest.coinBacks } } }) }));

  await page.goto(appPath("/paipan/luoji"));
  await expect(page.getByRole("heading", { name: "起盘信息" })).toBeVisible();
  await expect(page.locator(".luoji-mode-grid button")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.getByRole("button", { name: /盘名起盘法/ }).click();
  await expect(page.locator(".luoji-hexagram-select")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "选择本卦，当前乾为天" })).toContainText("䷀");
  await page.getByRole("button", { name: "选择本卦，当前乾为天" }).click();
  await expect(page.getByRole("dialog", { name: "选择本卦" })).toBeVisible();
  await expect(page.locator(".luoji-palace-picker button")).toHaveCount(8);
  await expect(page.locator(".luoji-hexagram-options button")).toHaveCount(8);
  await page.getByRole("button", { name: /兑宫/ }).click();
  await page.getByRole("button", { name: /泽水困/ }).click();
  await expect(page.getByRole("button", { name: "选择本卦，当前泽水困" })).toContainText("䷮");
  await page.getByRole("button", { name: /硬币背数法/ }).click();
  const backsInput = page.getByLabel("六次硬币背数");
  await expect(backsInput).toHaveAttribute("inputmode", "numeric");
  await expect(backsInput).toHaveAttribute("autocomplete", "one-time-code");
  await expect(page.locator(".luoji-code-boxes > span")).toHaveCount(6);
  await backsInput.fill("312101");
  await expect(page.locator(".luoji-code-boxes b")).toHaveText(["3", "1", "2", "1", "0", "1"]);
  await page.getByRole("button", { name: "重新起盘" }).click();
  await expect(backsInput).toHaveValue("");
  await page.getByRole("button", { name: /铜钱摇盘法/ }).click();
  await expect(page.locator(".luoji-back-sequence > button")).toHaveCount(6);
  const tossButton = page.locator(".luoji-toss");
  for (let index = 0; index < 6; index += 1) {
    await tossButton.click();
    if (index < 5) await expect(tossButton).toBeEnabled();
  }
  await expect(tossButton).toBeDisabled();
  await expect(tossButton).toContainText("六爻已完成");
  await page.getByPlaceholder("填写想要研究的事项").fill("项目安排");
  await page.getByRole("button", { name: "立即排盘" }).click();

  await expect(page).toHaveURL(/\/paipan\/luoji\/result$/);
  expect(latestRequest.mode).toBe("coins");
  expect(String(latestRequest.coinBacks)).toMatch(/^[0-3]{6}$/);
  await expect(page.getByRole("heading", { name: /火泽睽.*天水讼/ })).toBeVisible();
  await expect(page.locator(".luoji-line-row")).toHaveCount(6);
  await expect(page.locator(".luoji-line-row.moving")).toHaveCount(2);
  await expect(page.getByText("伏 妻财 丙子")).toBeVisible();
  await expect(page.locator(".luoji-line-side small")).toHaveCount(12);
  await expect(page.locator(".luoji-line-side small").filter({ hasText: "父母" }).first()).toBeVisible();
  await expect(page.locator(".luoji-line-side small").filter({ hasText: "兄弟" }).first()).toBeVisible();
  await expect(page.locator(".luoji-line-side small").filter({ hasText: "子孙" }).first()).toBeVisible();
  await expect(page.locator(".luoji-line-side small").filter({ hasText: "官鬼" }).first()).toBeVisible();
  await expect(page.locator(".luoji-chart-title > div > b")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "重新起盘" })).toHaveAttribute("data-paipan-action", "restart");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await page.reload();
  await expect(page.locator(".luoji-line-row")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: /火泽睽.*天水讼/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
