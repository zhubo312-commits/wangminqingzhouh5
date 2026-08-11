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
const outputRoot = path.join(repoRoot, "docs/juece-golden");
const legacyFiles = {
  "qimen.js": "pages/qimen/js/qimen.js",
  "myCalendar.js": "pages/qimen/js/myCalendar.js",
  "util.js": "pages/qimen/js/util.js",
  "qimen.vue": "pages/qimen/qimen.vue",
};

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

function flattenPalaces(panBody) {
  return panBody.flat().sort((left, right) => left.luoshu - right.luoshu);
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
  };
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

function createDiff(raw, current, request) {
  const legacy = normalizeLegacy(raw, request);
  const comparisons = [
    compareField("overview.effectiveDateTime", legacy.effectiveDateTime, current.overview.effectiveDateTime, "真太阳时沿用当前 Java 地区与校正能力；旧包只保留到分钟。"),
    compareField("overview.pillars", legacy.pillars, current.overview.pillars),
    compareField("overview.voidBranches", legacy.voidBranches, current.overview.voidBranches),
    compareField("overview.selectedVoidBranches", legacy.selectedVoidBranches, current.overview.selectedVoidBranches),
    compareField("overview.previousSolarTerm", legacy.previousSolarTerm, current.overview.previousSolarTerm, "节气秒值来自不同历法数据源，名称与用于起局的边界需教师核验。"),
    compareField("overview.nextSolarTerm", legacy.nextSolarTerm, current.overview.nextSolarTerm, "节气秒值来自不同历法数据源，名称与用于起局的边界需教师核验。"),
    compareField("overview.dunType", legacy.dunType, current.overview.dunType, "旧版以 juNum 正负表示阴阳遁，新版拆为 dunType 与正整数 juNumber。"),
    compareField("overview.juNumber", legacy.juNumber, current.overview.juNumber),
    compareField("overview.xunShou", legacy.xunShou, current.overview.xunShou),
    compareField("overview.chiefStar", legacy.chiefStar, current.overview.chiefStar),
    compareField("overview.chiefDoor", legacy.chiefDoor, current.overview.chiefDoor),
    compareField("overview.horse", legacy.horse, current.overview.horse),
    ...legacy.palaces.flatMap((palace) => {
      const next = current.palaces.find((candidate) => candidate.index === palace.index);
      return [
        compareField(`palaces[${palace.index}].heavenPlate`, palace.heavenPlate, next?.heavenPlate),
        compareField(`palaces[${palace.index}].earthPlate`, palace.earthPlate, next?.earthPlate),
        compareField(`palaces[${palace.index}].attached`, palace.attached, next?.attached),
        compareField(`palaces[${palace.index}].hiddenGanZhi`, palace.hiddenGanZhi, next?.hiddenGanZhi),
        compareField(`palaces[${palace.index}].isVoid`, palace.isVoid, next?.isVoid),
        compareField(`palaces[${palace.index}].isHorse`, palace.isHorse, next?.isHorse),
        compareField(`palaces[${palace.index}].isChief`, palace.isChief, next?.isChief),
        compareField(`palaces[${palace.index}].isChiefDoor`, palace.isChiefDoor, next?.isChiefDoor),
      ];
    }),
  ];
  return {
    result: comparisons.every((entry) => entry.status === "equal") ? "all_mapped_fields_equal" : "differences_found",
    mappingNotes: [
      "旧版 panHead/panBody 已映射为新版 overview/palaces。",
      "新版新增标准化中文标签、宫位方向五行、值符值使宫位与时区核验字段。",
      "旧版调试字段、样式字段和算法过程对象不进入公开响应。",
    ],
    comparisons,
  };
}

await mkdir(outputRoot, { recursive: true });
const hashes = {};
for (const [name, relativePath] of Object.entries(legacyFiles)) {
  hashes[name] = await sha256(path.join(legacyRoot, relativePath));
}
await writeFile(path.join(outputRoot, "source-manifest.json"), json({
  source: "yipu-h5-lengshan local migration reference",
  files: Object.fromEntries(Object.entries(legacyFiles).map(([name, relativePath]) => [name, {
    path: relativePath,
    sha256: hashes[name],
  }])),
}));

const Qimen = require(path.join(legacyRoot, legacyFiles["qimen.js"]));
for (const item of jueceGoldenCases) {
  const directory = path.join(outputRoot, item.id);
  await mkdir(directory, { recursive: true });
  const legacy = legacySnapshot(Qimen, item);
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
    writeFile(path.join(directory, "new-normalized.json"), json(current)),
    writeFile(path.join(directory, "field-diff.json"), json(createDiff(legacy, current, item.request))),
  ]);
}

console.log(`Generated ${jueceGoldenCases.length} golden cases in ${outputRoot}`);
