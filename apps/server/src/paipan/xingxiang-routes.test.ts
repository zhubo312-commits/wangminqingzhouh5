import {
  XingxiangChartResponseSchema,
  XingxiangChartWithReferenceSchema,
  XingxiangContextResponseSchema,
  type XingxiangChartRequest,
} from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { hashPaipanReference } from "./paipan-context.repository.js";

const resources: Array<{ app: Awaited<ReturnType<typeof buildApp>>; database: DatabaseContext }> = [];
const request: XingxiangChartRequest = { name: "测试", gender: "male", birthDateTime: "1990-01-01 12:00", school: "flying" };
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const names = ["交友", "迁移", "疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄"] as const;
const dynamicNames = branches.map((branch, index) => ({ branch, name: names[index]! }));
const transformations = [
  { transformation: "禄", star: "巨门" },
  { transformation: "权", star: "太阳" },
  { transformation: "科", star: "文曲" },
  { transformation: "忌", star: "文昌" },
] as const;
const annuals = Array.from({ length: 10 }, (_, index) => ({ age: 5 + index, year: 1993 + index, ganZhi: "癸酉", palaceNames: dynamicNames, transformations }));
const chart = {
  profile: { name: "测试", gender: "male", genderLabel: "男", yinYangGender: "阴男", solarDateTime: "1990-01-01 12:00", lunarDate: "一九八九年腊月初五日午时", fiveElementsBureau: "土五局", pillars: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" } },
  palaces: branches.map((branch, index) => ({ branch, name: names[index]!, heavenlyStem: "丙", bodyPalace: branch === "未", zodiacPalace: branch === "巳", originPalace: branch === "巳", stars: index === 0 ? [{ name: "破军", category: "major", brightness: "庙", natalTransformation: null }] : [], selfTransformations: index === 0 ? [{ transformation: "忌", star: "廉贞", inward: false }] : [] })),
  periods: Array.from({ length: 12 }, (_, index) => ({ ganZhi: "辛未", startAge: 5 + index * 10, endAge: 14 + index * 10, startYear: 1993 + index * 10, endYear: 2002 + index * 10, palaceNames: dynamicNames, transformations, annuals })),
};

function config() { return loadConfig({ NODE_ENV: "test", SQLITE_PATH: ":memory:", LOG_LEVEL: "silent", PAIPAN_SERVICE_URL: "http://paipan.test", PAIPAN_TIMEOUT_MS: "8000" }); }
async function setup(fetchImpl: typeof fetch) { const database = createDatabase(":memory:"); const app = await buildApp({ config: config(), database, fetchImpl, serveStatic: false }); resources.push({ app, database }); return { app, database }; }
afterEach(async () => { for (const resource of resources.splice(0)) { await resource.app.close(); resource.database.close(); } });

describe("Xingxiang public routes", () => {
  it("creates and restores a typed private context", async () => {
    expect(XingxiangChartResponseSchema.safeParse(chart).success).toBe(true);
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/xingxiang/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      return new Response(JSON.stringify(chart), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const { app, database } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/xingxiang/chart", payload: request });
    expect(response.statusCode, response.body).toBe(200);
    const created = XingxiangChartWithReferenceSchema.parse(response.json());
    expect(database.raw.prepare("SELECT reference_hash, chart_type, schema_version FROM paipan_contexts").get()).toEqual({ reference_hash: hashPaipanReference(created.paipan_ref), chart_type: "xingxiang", schema_version: "guoxue.paipan.xingxiang.v1" });
    const restoredResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/xingxiang/context", payload: { paipan_ref: created.paipan_ref } });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = XingxiangContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.profile.fiveElementsBureau).toBe("土五局");
  });

  it("rejects invalid gender before Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/xingxiang/chart", payload: { ...request, gender: "unknown" } });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
