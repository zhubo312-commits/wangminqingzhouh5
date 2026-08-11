import {
  YinpanChartResponseSchema,
  YinpanChartWithReferenceSchema,
  YinpanContextResponseSchema,
  type YinpanChartRequest,
} from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { hashPaipanReference } from "./paipan-context.repository.js";

const resources: Array<{
  app: Awaited<ReturnType<typeof buildApp>>;
  database: DatabaseContext;
}> = [];

const request: YinpanChartRequest = {
  chartDateTime: "2026-08-11 21:31",
  gender: "male",
  question: "",
  mode: "time",
  lifetime: false,
};

const palaceNames = [
  [1, "坎", "北方", "水"],
  [2, "坤", "西南", "土"],
  [3, "震", "东方", "木"],
  [4, "巽", "东南", "木"],
  [5, "中", "中央", "土"],
  [6, "乾", "西北", "金"],
  [7, "兑", "西方", "金"],
  [8, "艮", "东北", "土"],
  [9, "离", "南方", "火"],
] as const;

const chart = YinpanChartResponseSchema.parse({
  overview: {
    method: "时盘",
    question: "",
    gender: "male",
    solarDateTime: "2026-08-11 21:31",
    lunarDate: "二〇二六年六月廿九日",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" },
    voidBranches: "寅卯",
    dunType: "阴",
    juNumber: 9,
    xunShou: "甲辰壬",
    chiefStar: { name: "天芮星", palace: 6 },
    chiefDoor: { name: "死", palace: 7 },
    previousSolarTerm: "立秋",
    nextSolarTerm: "处暑",
    monthGeneral: "午",
    horse: { branch: "巳", palace: 4 },
  },
  palaces: palaceNames.map(([index, trigram, direction, element]) => ({
    index,
    trigram,
    direction,
    element,
    deity: index === 5 ? null : "九天",
    star: index === 5 ? null : "天柱",
    door: index === 5 ? null : "开",
    heavenStems: index === 5 ? [] : ["庚"],
    earthStems: ["乙"],
    hiddenStem: index === 5 ? null : "己",
    harms: index === 2 ? [{ symbol: "癸", type: "墓" }] : [],
    heavenGrowth: index === 1 ? [{ branch: "子", stage: "死" }] : [],
    earthGrowth: index === 1 ? [{ branch: "子", stage: "病" }] : [],
    isVoid: index === 3 || index === 8,
    isHorse: index === 4,
    isChief: index === 6,
    isChiefDoor: index === 7,
  })),
  heavenEarthGates: "子丑寅卯辰巳午未申酉戌亥".split("").map((branch, index) => ({
    branch,
    heavenGate: `天门${index + 1}`,
    earthGate: `地户${index + 1}`,
  })),
  lifetimeChart: null,
});

function appConfig() {
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
  const app = await buildApp({
    config: appConfig(),
    database,
    fetchImpl,
    serveStatic: false,
  });
  resources.push({ app, database });
  return { app, database };
}

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    resource.database.close();
  }
});

describe("Yinpan public routes", () => {
  it("creates and restores one typed versioned context", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/yinpan-juece/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      const javaChart = JSON.parse(JSON.stringify(chart)) as {
        lifetimeChart?: unknown;
        palaces: Array<Record<string, unknown>>;
      };
      delete javaChart.lifetimeChart;
      const center = javaChart.palaces.find((palace) => palace.index === 5);
      if (center) {
        delete center.deity;
        delete center.star;
        delete center.door;
        delete center.hiddenStem;
      }
      return new Response(JSON.stringify(javaChart), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const { app, database } = await setup(fetchMock);

    const createdResponse = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/yinpan-juece/chart",
      payload: request,
    });
    expect(createdResponse.statusCode).toBe(200);
    const created = YinpanChartWithReferenceSchema.parse(createdResponse.json());
    expect(created.lifetimeChart).toBeNull();
    expect(created.palaces.find((palace) => palace.index === 5)).toMatchObject({
      deity: null,
      star: null,
      door: null,
      hiddenStem: null,
    });
    expect(database.raw.prepare(
      "SELECT reference_hash, chart_type, schema_version FROM paipan_contexts",
    ).get()).toEqual({
      reference_hash: hashPaipanReference(created.paipan_ref),
      chart_type: "yinpan_juece",
      schema_version: "guoxue.paipan.yinpan_juece.v1",
    });

    const restoredResponse = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/yinpan-juece/context",
      payload: { paipan_ref: created.paipan_ref },
    });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = YinpanContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.overview.juNumber).toBe(9);
    expect(restored.chart.palaces).toHaveLength(9);
  });

  it("rejects invalid public input before calling Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/yinpan-juece/chart",
      payload: { ...request, mode: "unknown" },
    });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Java failures and invalid responses", async () => {
    const java422 = await setup(async () => new Response(
      JSON.stringify({ message: "排盘时间无效", errors: [] }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    ));
    const invalidJson = await setup(async () => new Response("not-json", { status: 200 }));
    const inject = (app: Awaited<ReturnType<typeof buildApp>>) => app.inject({
      method: "POST",
      url: "/api/v1/paipan/yinpan-juece/chart",
      payload: request,
    });
    expect((await inject(java422.app)).statusCode).toBe(422);
    expect((await inject(invalidJson.app)).statusCode).toBe(502);
  });
});
