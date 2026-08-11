import {
  LuojiChartResponseSchema,
  LuojiChartWithReferenceSchema,
  LuojiContextResponseSchema,
  type LuojiChartRequest,
} from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { hashPaipanReference } from "./paipan-context.repository.js";

const resources: Array<{ app: Awaited<ReturnType<typeof buildApp>>; database: DatabaseContext }> = [];
const request: LuojiChartRequest = {
  chartDateTime: "2026-08-11 21:31",
  question: "",
  mode: "backs",
  coinBacks: "312101",
};

const originalLines = ["yang", "yin", "yang", "yin", "yang", "yang"] as const;
const changedLines = ["yang", "yang", "yang", "yin", "yang", "yin"] as const;
const deities = ["青龙", "玄武", "白虎", "螣蛇", "勾陈", "朱雀"] as const;
const originalKin = ["父母", "兄弟", "子孙", "兄弟", "官鬼", "父母"] as const;
const originalGz = ["己巳", "己未", "己酉", "丁丑", "丁卯", "丁巳"] as const;
const changedKin = ["兄弟", "子孙", "父母", "父母", "兄弟", "官鬼"] as const;
const changedGz = ["壬戌", "壬申", "壬午", "戊午", "戊辰", "戊寅"] as const;
const elements = (value: string) => "巳午".includes(value[1] ?? "") ? "火" : "申酉".includes(value[1] ?? "") ? "金" : "寅卯".includes(value[1] ?? "") ? "木" : "子亥".includes(value[1] ?? "") ? "水" : "土";
const chart = {
  overview: {
    method: "硬币背数法",
    question: "",
    solarDateTime: "2026-08-11 21:31",
    lunarDate: "丙午年丙申月丁巳日辛亥时",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" },
    voidBranches: "子丑",
    coinBacks: "312101",
  },
  original: {
    name: "火泽睽",
    upperTrigram: "离",
    lowerTrigram: "兑",
    lines: originalLines,
    palace: { name: "艮宫", sequence: 5, element: "土" },
    shiLine: 4,
    yingLine: 1,
  },
  changed: {
    name: "天水讼",
    upperTrigram: "乾",
    lowerTrigram: "坎",
    lines: changedLines,
    palace: { name: "离宫", sequence: 7, type: "游魂", element: "火" },
    shiLine: 4,
    yingLine: 1,
  },
  lines: originalLines.map((originalLine, index) => ({
    position: 6 - index,
    deity: deities[index],
    ...(index === 1 ? { hiddenKin: "妻财", hiddenStemBranch: "丙子" } : {}),
    originalKin: originalKin[index],
    originalStemBranch: originalGz[index],
    originalElement: elements(originalGz[index]!),
    originalLine,
    isMoving: index === 1 || index === 5,
    ...(index === 2 ? { marker: "世" } : index === 5 ? { marker: "应" } : {}),
    changedKin: changedKin[index],
    changedStemBranch: changedGz[index],
    changedElement: elements(changedGz[index]!),
    changedLine: changedLines[index],
  })),
};

function appConfig() {
  return loadConfig({ NODE_ENV: "test", SQLITE_PATH: ":memory:", LOG_LEVEL: "silent", PAIPAN_SERVICE_URL: "http://paipan.test", PAIPAN_TIMEOUT_MS: "8000" });
}

async function setup(fetchImpl: typeof fetch) {
  const database = createDatabase(":memory:");
  const app = await buildApp({ config: appConfig(), database, fetchImpl, serveStatic: false });
  resources.push({ app, database });
  return { app, database };
}

afterEach(async () => {
  for (const resource of resources.splice(0)) { await resource.app.close(); resource.database.close(); }
});

describe("Luoji public routes", () => {
  it("normalizes omitted Java nulls and restores the typed context", async () => {
    const parsed = LuojiChartResponseSchema.safeParse(chart);
    expect(parsed.success, parsed.success ? "" : parsed.error.message).toBe(true);
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/luoji/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      return new Response(JSON.stringify(chart), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const { app, database } = await setup(fetchMock);

    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/luoji/chart", payload: request });
    expect(response.statusCode, response.body).toBe(200);
    const created = LuojiChartWithReferenceSchema.parse(response.json());
    expect(created.original.palace.type).toBeNull();
    expect(created.lines[0]).toMatchObject({ hiddenKin: null, hiddenStemBranch: null, marker: null });
    expect(database.raw.prepare("SELECT reference_hash, chart_type, schema_version FROM paipan_contexts").get()).toEqual({
      reference_hash: hashPaipanReference(created.paipan_ref),
      chart_type: "luoji",
      schema_version: "guoxue.paipan.luoji.v1",
    });

    const restoredResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/luoji/context", payload: { paipan_ref: created.paipan_ref } });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = LuojiContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.original.name).toBe("火泽睽");
  });

  it("rejects an invalid six-digit input before Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/luoji/chart", payload: { ...request, coinBacks: "31210" } });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
