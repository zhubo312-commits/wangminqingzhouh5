import {
  ShanxiangChartResponseSchema,
  ShanxiangChartWithReferenceSchema,
  ShanxiangContextResponseSchema,
  type ShanxiangChartRequest,
} from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { hashPaipanReference } from "./paipan-context.repository.js";

const resources: Array<{ app: Awaited<ReturnType<typeof buildApp>>; database: DatabaseContext }> = [];
const request: ShanxiangChartRequest = { year: 2026, degrees: 0, question: "书房布局" };

const palace = (index: number) => ({
  index,
  trigram: ["坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"][index - 1]!,
  direction: ["北", "西南", "东", "东南", "中", "西北", "西", "东北", "南"][index - 1]!,
  element: index === 1 ? "水" : "土",
  deity: index === 5 ? null : "值符",
  star: index === 5 ? null : "天芮",
  door: index === 5 ? null : "生",
  heavenStems: index === 5 ? [] : ["戊"],
  earthStems: index === 5 ? [] : ["庚"],
  hiddenStem: null,
  harms: [],
  heavenGrowth: [],
  earthGrowth: [],
  isVoid: index === 9,
  isHorse: index === 6,
  isChief: index === 6,
  isChiefDoor: index === 9,
});

const panel = (degrees: number) => ({
  overview: {
    degrees,
    direction: "癸",
    mountain: "丁",
    degreeRange: `${degrees}~${degrees + 4}`,
    dunType: "阴" as const,
    juNumber: 7,
    yearPillar: "丙午",
    hourPillar: "己丑",
    voidBranches: "午未",
    xunShou: "甲申庚",
    chiefStar: { name: "天芮星", palace: 6 },
    chiefDoor: { name: "死", palace: 9 },
    horse: { branch: "亥", palace: 6 },
    huangQuan: "黄泉亥",
  },
  palaces: Array.from({ length: 9 }, (_, index) => palace(index + 1)),
});

const chart = {
  overview: { year: 2026, selectedDegrees: 0, question: "书房布局" },
  panels: [panel(0), panel(5), panel(10)],
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

describe("Shanxiang public routes", () => {
  it("creates and restores a typed three-panel context", async () => {
    expect(ShanxiangChartResponseSchema.safeParse(chart).success).toBe(true);
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/shanxiang-juece/chart");
      expect(JSON.parse(String(init?.body))).toEqual(request);
      return new Response(JSON.stringify(chart), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const { app, database } = await setup(fetchMock);

    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/shanxiang-juece/chart", payload: request });
    expect(response.statusCode, response.body).toBe(200);
    const created = ShanxiangChartWithReferenceSchema.parse(response.json());
    expect(created.panels.map((item) => item.overview.degrees)).toEqual([0, 5, 10]);
    expect(database.raw.prepare("SELECT reference_hash, chart_type, schema_version FROM paipan_contexts").get()).toEqual({
      reference_hash: hashPaipanReference(created.paipan_ref),
      chart_type: "shanxiang_juece",
      schema_version: "guoxue.paipan.shanxiang_juece.v1",
    });

    const restoredResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/shanxiang-juece/context", payload: { paipan_ref: created.paipan_ref } });
    expect(restoredResponse.statusCode).toBe(200);
    const restored = ShanxiangContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.panels[0]?.overview.huangQuan).toBe("黄泉亥");
  });

  it("rejects an out-of-range degree before Java", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(fetchMock);
    const response = await app.inject({ method: "POST", url: "/api/v1/paipan/shanxiang-juece/chart", payload: { ...request, degrees: 361 } });
    expect(response.statusCode).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
