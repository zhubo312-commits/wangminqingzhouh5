import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jueceGoldenCases } from "./juece-golden-cases.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacyRoot = process.env.LEGACY_JUECE_ROOT
  ?? "/tmp/yipu-h5-plan-019fefd7/yipu-h5-lengshan";
const serviceUrl = process.env.JUECE_SERVICE_URL ?? "http://127.0.0.1:18080";
const referenceApiUrl = process.env.JUECE_REFERENCE_API_URL
  ?? "https://ft.bavor.cn/prod-api/app/qimen/getXingHeQimenH5";
const outputRoot = path.join(repoRoot, "docs/juece-golden");
const legacyFiles = {
  "qimen.js": "pages/qimen/js/qimen.js",
  "myCalendar.js": "pages/qimen/js/myCalendar.js",
  "util.js": "pages/qimen/js/util.js",
  "qimen.vue": "pages/qimen/qimen.vue",
};
const referenceAssets = {
  app: "https://ft.bavor.cn/static/js/index.3d1307ad.js",
  form: "https://ft.bavor.cn/static/js/pages-qimen-qimen.4bb38141.js",
  rotating: "https://ft.bavor.cn/static/js/pages-qimen-zhuanpan-zhuanpan.bf031021.js",
  flying: "https://ft.bavor.cn/static/js/pages-qimen-feipan-feipan.c40a9a46.js",
};

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function remoteSha256(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`reference asset ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { url, sha256: createHash("sha256").update(bytes).digest("hex") };
}

function flattenPalaces(panBody) {
  return panBody.flat().sort((left, right) => left.luoshu - right.luoshu);
}

function doorName(value) {
  return value && !value.endsWith("门") ? `${value}门` : value ?? null;
}

function starName(value) {
  return value?.endsWith("星") ? value.slice(0, -1) : value ?? null;
}

function legacySnapshot(Qimen, item) {
  const params = {
    dateStr: item.request.chartDateTime,
    panType: item.legacy.panType,
    juType: item.legacy.juType,
    selectJu: item.legacy.selectJu,
    ext: {
      emptyType: item.legacy.emptyType,
      attachType: item.legacy.attachType,
      ...(item.legacy.longitude ? { geo: { longitude: item.legacy.longitude } } : {}),
    },
  };
  const originalLog = console.log;
  console.log = () => {};
  try {
    const chart = item.legacy.panType === 0
      ? new Qimen.ZhuanPan(params)
      : new Qimen.FeiPan(params);
    return {
      input: params,
      calendar: chart.calendar,
      panHead: chart.panHead,
      panBody: chart.panBody,
    };
  } finally {
    console.log = originalLog;
  }
}

function normalizeLegacy(raw, request) {
  const palaces = flattenPalaces(raw.panBody);
  const isFlying = request.pan.style === "flying";
  const realTimeMatch = raw.calendar.realGlDate?.match(/^(\d{2})月(\d{2})日(\d{2}):(\d{2})$/);
  const effectiveDateTime = realTimeMatch
    ? `${raw.calendar.cYear}-${realTimeMatch[1]}-${realTimeMatch[2]} ${realTimeMatch[3]}:${realTimeMatch[4]}`
    : request.chartDateTime;
  const normalizedPalaces = palaces.map((palace) => ({
    index: palace.luoshu,
    heavenPlate: {
      stem: palace.roofGan || null,
      star: palace.roofStar || null,
      door: palace.roofDoor || null,
      deity: palace.roofDeity || palace.deity || null,
    },
    earthPlate: {
      stem: palace.earthGan || null,
      star: palace.earthStar || null,
      door: palace.earthDoor || null,
      deity: palace.earthDeity || null,
    },
    attached: isFlying || !palace.attachEarthGan ? null : {
      earthStem: palace.attachEarthGan,
      earthStar: palace.attachEarthStar,
      heavenStem: palace.attachRoofGan || null,
      heavenStar: palace.attachRoofStar || null,
    },
    hiddenGanZhi: palace.darkGz || null,
    harms: [],
    heavenGrowth: [],
    earthGrowth: [],
    isVoid: Boolean(palace.isEmpty),
    isHorse: Boolean(palace.isHorse),
    isChief: palace.roofStar === raw.panHead.zhiFu || palace.attachRoofStar === raw.panHead.zhiFu,
    isChiefDoor: palace.roofDoor === raw.panHead.zhiShi,
  }));
  const voidField = { hour: "hEmpty", day: "dEmpty", month: "mEmpty", year: "yEmpty" }[request.voidBasis];
  return {
    effectiveDateTime,
    pillars: {
      year: raw.calendar.gzYear,
      month: raw.calendar.gzMonth,
      day: raw.calendar.gzDay,
      hour: raw.calendar.gzHours,
    },
    voidBranches: {
      year: raw.panHead.allEmpty.yEmpty,
      month: raw.panHead.allEmpty.mEmpty,
      day: raw.panHead.allEmpty.dEmpty,
      hour: raw.panHead.allEmpty.hEmpty,
    },
    selectedVoidBranches: raw.panHead.allEmpty[voidField],
    previousSolarTerm: {
      name: raw.calendar.prevTerm,
      dateTime: raw.calendar.prevTermTimeStr,
    },
    nextSolarTerm: {
      name: raw.calendar.afterTerm,
      dateTime: raw.calendar.afterTermTimeStr,
    },
    dunType: raw.panHead.juNum < 0 ? "阴" : "阳",
    juNumber: Math.abs(raw.panHead.juNum),
    xunShou: raw.panHead.hHeadName,
    chiefStar: {
      name: raw.panHead.zhiFu,
      palace: normalizedPalaces.find((palace) => palace.isChief)?.index,
    },
    chiefDoor: {
      name: raw.panHead.zhiShi,
      palace: normalizedPalaces.find((palace) => palace.isChiefDoor)?.index,
    },
    horse: {
      branch: raw.panHead.horse,
      palace: normalizedPalaces.find((palace) => palace.isHorse)?.index,
    },
    palaces: normalizedPalaces,
    heavenEarthGates: [],
  };
}

async function referenceSnapshot(Qimen, item) {
  if (item.request.pan.style === "flying") {
    return {
      source: "https://ft.bavor.cn/#/pages/qimen/feipan/feipan",
      capturedAt: new Date().toISOString(),
      execution: "reference site client algorithm with frozen production-equivalent qimen.js",
      result: legacySnapshot(Qimen, item),
    };
  }
  const url = new URL(referenceApiUrl);
  url.search = new URLSearchParams({
    birthDay: item.request.chartDateTime,
    question: "",
    isKe: "4",
  }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${item.id} reference response ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  if (payload.code !== 200) throw new Error(`${item.id} reference error: ${payload.msg ?? "unknown"}`);
  return {
    source: url.toString(),
    capturedAt: new Date().toISOString(),
    execution: "reference site Xinghe API",
    result: payload,
  };
}

function normalizeRotatingReference(snapshot) {
  const raw = snapshot.result.data;
  const overview = raw.qiMenZao;
  const palaces = raw.qimenGong
    .map((palace) => {
      let earthStem = palace.diPan === "UNKNOWN" ? null : palace.diPan;
      let attached = null;
      if (palace.index === 2 && earthStem?.length > 1) {
        attached = {
          earthStem: earthStem.slice(1),
          earthStar: "天禽",
          heavenStem: null,
          heavenStar: null,
        };
        earthStem = earthStem.slice(0, 1);
      }
      return {
        index: palace.index,
        heavenPlate: {
          stem: palace.tianPan === "UNKNOWN" ? null : palace.tianPan,
          star: palace.baXing ?? null,
          door: doorName(palace.newBaMen),
          deity: palace.baShen ?? null,
        },
        earthPlate: {
          stem: earthStem,
          star: starName(palace.jiuXing),
          door: palace.index === 5 ? null : doorName(palace.baMen),
          deity: null,
        },
        attached,
        hiddenGanZhi: palace.YinGan ?? palace.yinGan ?? null,
        harms: (palace.siHai ?? []).map((harm) => ({
          symbol: harm.word,
          type: harm.siHai,
        })),
        heavenGrowth: (palace.tianGanChangSheng ?? []).map((item) => ({
          branch: item.title,
          stage: item.content,
        })),
        earthGrowth: (palace.diZhiChangSheng ?? []).map((item) => ({
          branch: item.title,
          stage: item.content,
        })),
        isVoid: Boolean(palace.isXunKong ?? palace.xunKong),
        isHorse: Boolean(palace.isMaXing ?? palace.maXing),
        isChief: palace.index === overview.zhiFuIndex,
        isChiefDoor: palace.index === overview.zhiShiIndex,
      };
    })
    .sort((left, right) => left.index - right.index);
  return {
    effectiveDateTime: overview.yearGongLi,
    pillars: {
      year: overview.yearGanZhi,
      month: overview.monthGanZhi,
      day: overview.dayGanZhi,
      hour: overview.hourGanZhi,
    },
    voidBranches: {
      year: overview.yearXunKong,
      month: overview.monthXunKong,
      day: overview.dayXunKong,
      hour: overview.timeXunKong,
    },
    selectedVoidBranches: overview.timeXunKong,
    previousSolarTerm: { name: overview.prevJieQiName, dateTime: overview.prevJieQiTime },
    nextSolarTerm: { name: overview.nextJieQiName, dateTime: overview.nextJieQiTime },
    dunType: overview.yinOrYangDun,
    juNumber: overview.juShu,
    xunShou: overview.xunShou,
    chiefStar: { name: starName(overview.zhiFu), palace: overview.zhiFuIndex },
    chiefDoor: { name: doorName(overview.zhiShi), palace: overview.zhiShiIndex },
    horse: {
      branch: overview.maXingContent,
      palace: palaces.find((palace) => palace.isHorse)?.index,
    },
    palaces,
    heavenEarthGates: raw.tianMenDiHuList.map((item) => ({
      branch: item.diZhi,
      heavenGate: item.tianMen,
      earthGate: item.diHu,
    })),
  };
}

function normalizeReference(snapshot, request) {
  return request.pan.style === "rotating"
    ? normalizeRotatingReference(snapshot)
    : normalizeLegacy(snapshot.result, request);
}

function compareField(field, legacy, current, note = null) {
  return {
    field,
    legacy,
    current,
    status: JSON.stringify(legacy) === JSON.stringify(current) ? "equal" : "different",
    ...(note ? { note } : {}),
  };
}

function createDiff(referenceSnapshotValue, current, request) {
  const reference = normalizeReference(referenceSnapshotValue, request);
  const comparisons = [
    compareField("overview.effectiveDateTime", reference.effectiveDateTime, current.overview.effectiveDateTime),
    compareField("overview.pillars", reference.pillars, current.overview.pillars),
    compareField("overview.voidBranches", reference.voidBranches, current.overview.voidBranches),
    compareField("overview.selectedVoidBranches", reference.selectedVoidBranches, current.overview.selectedVoidBranches),
    compareField("overview.previousSolarTerm", reference.previousSolarTerm, current.overview.previousSolarTerm),
    compareField("overview.nextSolarTerm", reference.nextSolarTerm, current.overview.nextSolarTerm),
    compareField("overview.dunType", reference.dunType, current.overview.dunType),
    compareField("overview.juNumber", reference.juNumber, current.overview.juNumber),
    compareField("overview.xunShou", reference.xunShou, current.overview.xunShou),
    compareField("overview.chiefStar", reference.chiefStar, current.overview.chiefStar),
    compareField("overview.chiefDoor", reference.chiefDoor, current.overview.chiefDoor),
    compareField("overview.horse", reference.horse, current.overview.horse),
    ...reference.palaces.flatMap((palace) => {
      const next = current.palaces.find((candidate) => candidate.index === palace.index);
      return [
        compareField(`palaces[${palace.index}].heavenPlate`, palace.heavenPlate, next?.heavenPlate),
        compareField(`palaces[${palace.index}].earthPlate`, palace.earthPlate, next?.earthPlate),
        compareField(`palaces[${palace.index}].attached`, palace.attached, next?.attached),
        compareField(`palaces[${palace.index}].hiddenGanZhi`, palace.hiddenGanZhi, next?.hiddenGanZhi),
        compareField(`palaces[${palace.index}].harms`, palace.harms, next?.harms),
        compareField(`palaces[${palace.index}].heavenGrowth`, palace.heavenGrowth, next?.heavenGrowth),
        compareField(`palaces[${palace.index}].earthGrowth`, palace.earthGrowth, next?.earthGrowth),
        compareField(`palaces[${palace.index}].isVoid`, palace.isVoid, next?.isVoid),
        compareField(`palaces[${palace.index}].isHorse`, palace.isHorse, next?.isHorse),
        compareField(`palaces[${palace.index}].isChief`, palace.isChief, next?.isChief),
        compareField(`palaces[${palace.index}].isChiefDoor`, palace.isChiefDoor, next?.isChiefDoor),
      ];
    }),
    compareField("heavenEarthGates", reference.heavenEarthGates, current.heavenEarthGates),
  ];
  return {
    result: comparisons.every((entry) => entry.status === "equal") ? "all_mapped_fields_equal" : "differences_found",
    mappingNotes: [
      "ft.bavor.cn 当前结果已映射为新版 overview/palaces。",
      "参考站转盘固定调用星河接口并忽略历史定局、旬空与寄宫选项；新版保持相同行为。",
      "新版新增标准化中文标签、宫位方向五行、值符值使宫位与时区核验字段。",
      "参考站样式字段和算法过程对象不进入公开响应。",
    ],
    comparisons,
  };
}

await mkdir(outputRoot, { recursive: true });
const hashes = {};
for (const [name, relativePath] of Object.entries(legacyFiles)) {
  hashes[name] = await sha256(path.join(legacyRoot, relativePath));
}
const referenceHashes = Object.fromEntries(await Promise.all(
  Object.entries(referenceAssets).map(async ([name, url]) => [name, await remoteSha256(url)]),
));
await writeFile(path.join(outputRoot, "source-manifest.json"), json({
  authority: {
    site: "https://ft.bavor.cn/#/",
    capturedAt: new Date().toISOString(),
    assets: referenceHashes,
  },
  migrationReference: {
    source: "yipu-h5-lengshan local migration reference",
    files: Object.fromEntries(Object.entries(legacyFiles).map(([name, relativePath]) => [name, {
      path: relativePath,
      sha256: hashes[name],
    }])),
  },
}));

const Qimen = require(path.join(legacyRoot, legacyFiles["qimen.js"]));
for (const item of jueceGoldenCases) {
  const directory = path.join(outputRoot, item.id);
  await mkdir(directory, { recursive: true });
  const legacy = legacySnapshot(Qimen, item);
  const reference = await referenceSnapshot(Qimen, item);
  const response = await fetch(`${serviceUrl}/internal/v1/juece/chart`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(item.request),
  });
  if (!response.ok) throw new Error(`${item.id} Java response ${response.status}: ${await response.text()}`);
  const current = await response.json();
  await Promise.all([
    writeFile(path.join(directory, "request.json"), json(item.request)),
    writeFile(path.join(directory, "old-original.json"), json(legacy)),
    writeFile(path.join(directory, "reference-original.json"), json(reference)),
    writeFile(path.join(directory, "new-normalized.json"), json(current)),
    writeFile(path.join(directory, "field-diff.json"), json(createDiff(reference, current, item.request))),
  ]);
}

console.log(`Generated ${jueceGoldenCases.length} golden cases in ${outputRoot}`);
