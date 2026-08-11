import {
  MeihuaChartResponseSchema,
  MeihuaChartWithReferenceSchema,
  MeihuaContextResponseSchema,
  type MeihuaChartRequest,
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

const request: MeihuaChartRequest = {
  chartDateTime: "2026-08-11 21:31",
  mode: "time",
};

const trigram = (index: number, key: string, name: string, symbol: string, element: string, lines: string[]) => ({
  index, key, name, symbol, element, lines,
});

const chart = {
  overview: {
    method: "时间起盘",
    solarDateTime: "2026-08-11 21:31",
    lunarDate: "丙午年六月廿九日亥时",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" },
    voidBranches: "子丑",
    includeHour: false,
  },
  upperTrigram: 2,
  lowerTrigram: 6,
  movingLine: 6,
  original: {
    key: "duikan",
    name: "泽水困",
    upper: trigram(2, "dui", "兑", "☱", "金", ["yin", "yang", "yang"]),
    lower: trigram(6, "kan", "坎", "☵", "水", ["yin", "yang", "yin"]),
    lines: ["yin", "yang", "yin", "yang", "yang", "yin"],
  },
  mutual: {
    key: "xunli",
    name: "风火家人",
    upper: trigram(5, "xun", "巽", "☴", "木", ["yang", "yang", "yin"]),
    lower: trigram(3, "li", "离", "☲", "火", ["yang", "yin", "yang"]),
    lines: ["yang", "yin", "yang", "yin", "yang", "yang"],
  },
  changed: {
    key: "qiankan",
    name: "天水讼",
    upper: trigram(1, "qian", "乾", "☰", "金", ["yang", "yang", "yang"]),
    lower: trigram(6, "kan", "坎", "☵", "水", ["yin", "yang", "yin"]),
    lines: ["yin", "yang", "yin", "yang", "yang", "yang"],
  },
};

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
  const app = await buildApp({ config: appConfig(), database, fetchImpl, serveStatic: false });
  resources.push({ app, database });
  return { app, database };
}

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    resource.database.close();
  }
});

describe("Meihua public routes", () => {
  it("normalizes omitted Java nulls and restores one typed context", async () => {
    const parsedChart = MeihuaChartResponseSchema.safeParse(chart);
    expect(parsedChart.success, parsedChart.success ? "" : parsedChart.error.message).toBe(true);
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/meihua/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      return new Response(JSON.stringify(chart), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const { app, database } = await setup(fetchMock);

    const createdResponse = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/meihua/chart",
      payload: request,
    });
    expect(createdResponse.statusCode, createdResponse.body).toBe(200);
    const created = MeihuaChartWithReferenceSchema.parse(createdResponse.json());
    expect(created.overview).toMatchObject({ school: null, numberOne: null, numberTwo: null });
    expect(database.raw.prepare(
      "SELECT reference_hash, chart_type, schema_version FROM paipan_contexts",
    ).get()).toEqual({
      reference_hash: hashPaipanReference(created.paipan_ref),
      chart_type: "meihua",
      schema_version: "guoxue.paipan.meihua.v1",
    });

    const restoredResponse = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/meihua/context",
      payload: { paipan_ref: created.paipan_ref },
    });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = MeihuaContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.original.name).toBe("泽水困");
  });

  it("rejects incomplete number input before Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/meihua/chart",
      payload: { chartDateTime: "2026-08-11 21:31", mode: "number", numberOne: 123 },
    });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
