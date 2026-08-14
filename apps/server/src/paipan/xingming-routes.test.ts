import {
  XingmingChartResponseSchema,
  XingmingChartWithReferenceSchema,
  XingmingContextResponseSchema,
  type XingmingChartRequest,
  type XingmingChartResponse,
} from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { hashPaipanReference } from "./paipan-context.repository.js";

const resources: Array<{ app: Awaited<ReturnType<typeof buildApp>>; database: DatabaseContext }> = [];
const request: XingmingChartRequest = { surname: "李", givenName: "明", school: "wuge" };
const interpretation = (number: number, rating: string, summary: string | null = null) => ({ number, yinYang: "阳", rating, summary, categories: null, foundation: null, family: null, health: null, meaning: null, detail: null });
const usageReference = { recommendationPercent: 90, culturePercent: 88, genderTendency: 5, usageCount: 1000, firstCharacterPercent: 50, malePercent: 50, femalePercent: 50, sourceNote: "来源站统计，仅作参考" };
const chart: XingmingChartResponse = {
  dataset: { status: "official", version: "xingming-20260814.r1", dictionaryVersion: "kangxi-cn-20260813.r3", numerologyVersion: "yp-20260813.r1" },
  school: "wuge",
  name: { surname: "李", givenName: "明", fullName: "李明" },
  characters: [
    { input: "李", simplified: "李", traditional: "李", pinyin: "lǐ", radical: "木", kangxiStrokes: 7, calculationStrokes: 7, element: "火", rating: "吉", common: true, nameUsageClass: "姓名学", nameExplanation: null, namingMeaning: null, namingImplication: null, taboos: null, usageReference },
    { input: "明", simplified: "明", traditional: "明", pinyin: "míng", radical: "日", kangxiStrokes: 8, calculationStrokes: 8, element: "水", rating: "吉", common: true, nameUsageClass: "姓名学", nameExplanation: null, namingMeaning: null, namingImplication: null, taboos: null, usageReference },
  ],
  grids: [
    { key: "heaven", label: "天格", number: 8, interpretationNumber: 8, element: "金", rating: "吉", interpretation: interpretation(8, "吉") },
    { key: "person", label: "人格", number: 15, interpretationNumber: 15, element: "土", rating: "大吉", interpretation: interpretation(15, "大吉") },
    { key: "earth", label: "地格", number: 9, interpretationNumber: 9, element: "水", rating: "凶", interpretation: interpretation(9, "凶") },
    { key: "outer", label: "外格", number: 2, interpretationNumber: 2, element: "木", rating: "凶", interpretation: interpretation(2, "凶") },
    { key: "total", label: "总格", number: 15, interpretationNumber: 15, element: "土", rating: "大吉", interpretation: interpretation(15, "大吉") },
  ],
  threeTalents: { title: "金土水", rating: "吉", summary: null, foundationLuck: null, foundationRating: null, successLuck: null, successRating: null, relationships: null, relationshipsRating: null, personality: null, liugeSummary: null, liugeRating: null },
  elementRelations: [{ from: "天格", to: "人格", relation: "相生", summary: "天格金 → 人格土：相生" }, { from: "人格", to: "地格", relation: "相克", summary: "人格土 → 地格水：相克" }],
  score: 68,
  scoreBreakdown: { components: [{ key: "heaven", label: "天格", weightPercent: 20, rawScore: 70, contribution: 14 }, { key: "earth", label: "地格", weightPercent: 20, rawScore: 32, contribution: 6 }, { key: "person", label: "人格", weightPercent: 20, rawScore: 90, contribution: 18 }, { key: "threeTalents", label: "三才", weightPercent: 40, rawScore: 75, contribution: 30 }], total: 68, note: "传统姓名学参考" },
  totalGridDescription: interpretation(15, "大吉", "（福寿） 福寿圆满，富贵荣誉，涵养雅量，德高望重。"),
};

function config() {
  return loadConfig({
    NODE_ENV: "test",
    SQLITE_PATH: ":memory:",
    LOG_LEVEL: "silent",
    PAIPAN_SERVICE_URL: "http://paipan.test",
    PAIPAN_TIMEOUT_MS: "8000",
  });
}

async function setup(fetchImpl: typeof fetch) {
  const database = createDatabase(":memory:");
  const app = await buildApp({ config: config(), database, fetchImpl, serveStatic: false });
  resources.push({ app, database });
  return { app, database };
}

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    resource.database.close();
  }
});

describe("Xingming public routes", () => {
  it("rejects characters without an audited five-element value", () => {
    const result = XingmingChartResponseSchema.safeParse({
      ...chart,
      characters: [
        { ...chart.characters[0], input: "𠇹", simplified: "𠇹", traditional: "俓", element: "待核验" },
        chart.characters[1],
      ],
    });
    expect(result.success).toBe(false);
  });

  it("forwards the typed request and restores a private context", async () => {
    expect(XingmingChartResponseSchema.safeParse(chart).success).toBe(true);
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/xingming/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      return new Response(JSON.stringify(chart), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const { app, database } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/xingming/chart", payload: request });
    expect(response.statusCode, response.body).toBe(200);
    const created = XingmingChartWithReferenceSchema.parse(response.json());
    expect(database.raw.prepare("SELECT reference_hash, chart_type, schema_version FROM paipan_contexts").get()).toEqual({
      reference_hash: hashPaipanReference(created.paipan_ref),
      chart_type: "xingming",
      schema_version: "guoxue.paipan.xingming.v2",
    });
    const restoredResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/xingming/context", payload: { paipan_ref: created.paipan_ref } });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = XingmingContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.score).toBe(68);
  });

  it("rejects invalid cross-field input before calling Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/xingming/chart", payload: { surname: "李", givenName: "明明明", school: "liuge" } });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.json().errors[0].field).toBe("givenName");
  });

  it("maps Java dictionary misses to the public 422 problem response", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      code: "XINGMING_DATA_UNAVAILABLE",
      message: "正式康熙字库尚未收录“㐀”字",
      errors: [{ field: "surname", message: "正式康熙字库尚未收录“㐀”字" }],
    }), { status: 422, headers: { "Content-Type": "application/json" } }));
    const { app } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/xingming/chart", payload: { surname: "㐀", givenName: "明", school: "wuge" } });
    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ detail: "正式康熙字库尚未收录“㐀”字", errors: [{ field: "surname" }] });
  });
});
