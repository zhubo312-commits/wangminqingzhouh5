import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:4173";
const previewRoot = path.resolve(process.cwd(), "docs/previews");
const viewports = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const paipanRef = `pp_${"y".repeat(32)}`;

const reference = JSON.parse(await readFile(
  path.resolve(process.cwd(), "docs/yinpan-golden/case-01/reference-original.json"),
  "utf8",
)).data;
const source = reference.qiMenZao;
const chart = {
  overview: {
    method: "时盘",
    question: source.question ?? "",
    gender: "male",
    solarDateTime: source.yearGongLi,
    lunarDate: source.yearNongLi,
    pillars: {
      year: source.yearGanZhi,
      month: source.monthGanZhi,
      day: source.dayGanZhi,
      hour: source.hourGanZhi,
    },
    voidBranches: source.xunKong,
    dunType: source.yinOrYangDun,
    juNumber: source.juShu,
    xunShou: source.xunShou,
    chiefStar: { name: source.zhiFu, palace: source.zhiFuIndex },
    chiefDoor: { name: source.zhiShi, palace: source.zhiShiIndex },
    previousSolarTerm: source.prevJieQiName,
    nextSolarTerm: source.nextJieQiName,
    monthGeneral: source.yueJiang,
    horse: {
      branch: source.maXingContent,
      palace: reference.qimenGong.find((palace) => palace.isMaXing).index,
    },
  },
  palaces: reference.qimenGong.map((palace) => ({
    index: palace.index,
    trigram: palace.baGua,
    direction: palace.fangWei,
    element: palace.wuXing,
    deity: palace.baShen,
    star: palace.baXing,
    door: palace.newBaMen,
    heavenStems: palace.tianPan === "UNKNOWN" ? [] : [...palace.tianPan],
    earthStems: palace.diPan === "UNKNOWN" ? [] : [...palace.diPan],
    hiddenStem: palace.yinGan,
    harms: (palace.siHai ?? []).map((harm) => ({ symbol: harm.word, type: harm.siHai })),
    heavenGrowth: (palace.tianGanChangSheng ?? []).map((item) => ({ branch: item.title, stage: item.content })),
    earthGrowth: (palace.diZhiChangSheng ?? []).map((item) => ({ branch: item.title, stage: item.content })),
    isVoid: palace.isXunKong,
    isHorse: palace.isMaXing,
    isChief: palace.index === source.zhiFuIndex,
    isChiefDoor: palace.index === source.zhiShiIndex,
  })),
  heavenEarthGates: reference.tianMenDiHuList.map((item) => ({
    branch: item.diZhi,
    heavenGate: item.tianMen,
    earthGate: item.diHu,
  })),
  lifetimeChart: null,
};

async function assertNoOverflow(page, label) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (hasOverflow) throw new Error(`${label} has horizontal overflow`);
}

async function mockResult(page) {
  await page.addInitScript(({ key, value }) => {
    window.sessionStorage.setItem(key, value);
  }, { key: "guoxue.paipan.yinpan_juece_ref.v1", value: paipanRef });
  await page.route("**/api/v1/paipan/yinpan-juece/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "guoxue.paipan.yinpan_juece.v1",
      chartType: "yinpan_juece",
      paipan_ref: paipanRef,
      generatedAt: "2026-08-12T00:00:00.000Z",
      expiresAt: "2026-08-12T12:00:00.000Z",
      chartRequest: {
        chartDateTime: source.yearGongLi,
        gender: "male",
        question: "",
        mode: "time",
        lifetime: false,
      },
      chart,
    }),
  }));
}

await mkdir(previewRoot, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  for (const viewport of viewports) {
    const formContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const formPage = await formContext.newPage();
    await formPage.goto(`${baseUrl}/paipan/yinpan-juece`);
    await formPage.getByRole("heading", { name: "起局信息" }).waitFor();
    await assertNoOverflow(formPage, `${viewport.width}px form`);
    await formPage.screenshot({
      path: path.join(previewRoot, `yinpan-form-${viewport.width}.png`),
      fullPage: true,
    });
    await formContext.close();

    const resultContext = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const resultPage = await resultContext.newPage();
    await mockResult(resultPage);
    await resultPage.goto(`${baseUrl}/paipan/yinpan-juece/result`);
    await resultPage.getByRole("heading", { name: "阴遁9局" }).waitFor();
    await resultPage.locator(".yinpan-palace").filter({ hasText: "乾6" }).click();
    await resultPage.evaluate(() => window.scrollTo(0, 0));
    await assertNoOverflow(resultPage, `${viewport.width}px result`);
    await resultPage.screenshot({
      path: path.join(previewRoot, `yinpan-result-${viewport.width}.png`),
      fullPage: true,
    });
    await resultContext.close();
  }
} finally {
  await browser.close();
}

console.log("Captured three responsive Yinpan form/result pairs");
