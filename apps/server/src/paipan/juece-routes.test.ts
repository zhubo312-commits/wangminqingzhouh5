import {
  JueceChartResponseSchema,
  JueceChartWithReferenceSchema,
  JueceContextResponseSchema,
  type JueceChartRequest,
  type JueceChartResponse,
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

const request: JueceChartRequest = {
  chartDateTime: "2026-08-11 16:00",
  time: { mode: "standard" },
  pan: { style: "rotating", centerPalaceMethod: "kun" },
  bureau: { method: "chai_bu" },
  voidBasis: "hour",
};

const chart: JueceChartResponse = JueceChartResponseSchema.parse({
  overview: {
    method: "转盘 · 寄坤宫 · 拆补 · 时空",
    clockDateTime: "2026-08-11 16:00",
    effectiveDateTime: "2026-08-11 16:00",
    timeMode: "standard",
    areaCode: null,
    areaName: null,
    trueSolarTime: null,
    lunarDate: "二〇二六年六月廿九日",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "戊申" },
    voidBranches: { year: "寅卯", month: "辰巳", day: "子丑", hour: "寅卯" },
    selectedVoidBranches: "寅卯",
    previousSolarTerm: { name: "立秋", dateTime: "2026-08-07 19:42:40" },
    nextSolarTerm: { name: "处暑", dateTime: "2026-08-23 10:18:46" },
    panStyle: "rotating",
    panStyleLabel: "转盘",
    bureauMethod: "chai_bu",
    bureauLabel: "拆补",
    directionRule: null,
    centerPalaceMethod: "kun",
    dunType: "阴",
    juNumber: 5,
    xunShou: "甲辰壬",
    chiefStar: { name: "天蓬", palace: 2 },
    chiefDoor: { name: "休门", palace: 6 },
    horse: { branch: "寅", palace: 8 },
  },
  palaces: Array.from({ length: 9 }, (_, itemIndex) => {
    const index = itemIndex + 1;
    return {
      index,
      trigram: index === 5 ? "中" : "坎",
      direction: index === 5 ? "中" : "北",
      element: index === 5 ? "土" : "水",
      heavenPlate: {
        stem: index === 5 ? null : "壬",
        star: index === 5 ? null : "天蓬",
        door: index === 5 ? null : "休门",
        deity: index === 5 ? null : "值符",
      },
      earthPlate: { stem: "戊", star: index === 5 ? "天禽" : "天蓬", door: null, deity: null },
      attached: null,
      hiddenGanZhi: null,
      isVoid: index === 3 || index === 8,
      isHorse: index === 8,
      isChief: index === 2,
      isChiefDoor: index === 6,
    };
  }),
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

describe("Juece public routes", () => {
  it("keeps v1 contexts compatible when structural arrays are absent", () => {
    const legacy = JSON.parse(JSON.stringify(chart)) as {
      heavenEarthGates?: unknown;
      palaces: Array<Record<string, unknown>>;
    };
    delete legacy.heavenEarthGates;
    for (const palace of legacy.palaces) {
      delete palace.harms;
      delete palace.heavenGrowth;
      delete palace.earthGrowth;
    }

    const restored = JueceChartResponseSchema.parse(legacy);

    expect(restored.heavenEarthGates).toEqual([]);
    expect(restored.palaces.every((palace) => (
      palace.harms.length === 0
      && palace.heavenGrowth.length === 0
      && palace.earthGrowth.length === 0
    ))).toBe(true);
  });

  it("creates and restores one typed short-lived context", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/juece/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      return new Response(JSON.stringify(chart), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const { app, database } = await setup(fetchMock);
    const createdResponse = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/juece/chart",
      payload: request,
    });
    expect(createdResponse.statusCode).toBe(200);
    const created = JueceChartWithReferenceSchema.parse(createdResponse.json());
    expect(database.raw.prepare(
      "SELECT reference_hash, chart_type, schema_version FROM paipan_contexts",
    ).get()).toEqual({
      reference_hash: hashPaipanReference(created.paipan_ref),
      chart_type: "shijia_juece",
      schema_version: "guoxue.paipan.shijia_juece.v1",
    });

    const restoredResponse = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/juece/context",
      payload: { paipan_ref: created.paipan_ref },
    });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = JueceContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.overview.juNumber).toBe(5);
    expect(restored.chart.heavenEarthGates).toEqual([]);
    expect(restored.chart.palaces.every((palace) => palace.harms.length === 0)).toBe(true);

    database.raw.prepare(
      "UPDATE paipan_contexts SET schema_version = ? WHERE reference_hash = ?",
    ).run("guoxue.paipan.shijia_juece.v2", hashPaipanReference(created.paipan_ref));
    const mismatch = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/juece/context",
      payload: { paipan_ref: created.paipan_ref },
    });
    expect(mismatch.statusCode).toBe(404);
  });

  it("rejects mutually exclusive public input before calling Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/juece/chart",
      payload: {
        ...request,
        pan: { style: "flying", directionRule: "all_forward", centerPalaceMethod: "kun" },
      },
    });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Java validation, unavailability, timeout and invalid JSON", async () => {
    const java422 = await setup(async () => new Response(
      JSON.stringify({ message: "地区码不存在", errors: [] }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    ));
    const unavailable = await setup(async () => {
      throw new TypeError("connect failed");
    });
    const timeout = await setup(async () => {
      throw new DOMException("timed out", "TimeoutError");
    });
    const invalidJson = await setup(async () => new Response("not-json", { status: 200 }));

    const inject = (app: Awaited<ReturnType<typeof buildApp>>) => app.inject({
      method: "POST",
      url: "/api/v1/paipan/juece/chart",
      payload: request,
    });
    expect((await inject(java422.app)).statusCode).toBe(422);
    expect((await inject(unavailable.app)).statusCode).toBe(502);
    expect((await inject(timeout.app)).statusCode).toBe(504);
    expect((await inject(invalidJson.app)).statusCode).toBe(502);
  });
});
