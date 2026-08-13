import {
  ShuziGuilvChartWithReferenceSchema,
  ShuziGuilvContextResponseSchema,
  XuankongFeixingChartWithReferenceSchema,
  XuankongFeixingContextResponseSchema,
  type ShuziGuilvChartRequest,
  type XuankongFeixingChartRequest,
} from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";

const resources: Array<{ app: Awaited<ReturnType<typeof buildApp>>; database: DatabaseContext }> = [];
function config() { return loadConfig({ NODE_ENV: "test", SQLITE_PATH: ":memory:", LOG_LEVEL: "silent", PAIPAN_SERVICE_URL: "http://paipan.test", PAIPAN_TIMEOUT_MS: "8000" }); }
async function setup(fetchImpl: typeof fetch) { const database = createDatabase(":memory:"); const app = await buildApp({ config: config(), database, fetchImpl, serveStatic: false }); resources.push({ app, database }); return app; }
afterEach(async () => { for (const resource of resources.splice(0)) { await resource.app.close(); resource.database.close(); } });

describe("new paipan public routes", () => {
  it("creates and restores a number-pattern chart", async () => {
    const request: ShuziGuilvChartRequest = { name: "测试者", gender: "male", birthDateTime: "1990-01-01 12:00" };
    const cell = (numbers: number[], yinYang: Array<"阴" | "阳">, elements: Array<"金" | "木" | "水" | "火" | "土">) => ({ numbers, yinYang, elements });
    const chart = {
      overview: { name: "测试者", gender: "male", genderLabel: "男", solarDateTime: "1990-01-01 12:00", lunarDate: "一九八九年腊月初五日午时", chineseZodiac: "蛇" },
      innate: { year: cell([6], ["阴"], ["火"]), month: cell([12], ["阳"], ["水"]), day: cell([5], ["阴"], ["木"]), hour: cell([7], ["阴"], ["火"]) },
      acquired: { year: cell([12], ["阳"], ["水"]), month: cell([6], ["阴"], ["火"]), day: cell([11], ["阳"], ["金"]), hour: cell([1], ["阳"], ["水"]) },
      interpretations: [{ combination: "6-12/12-6", position: "年月", category: "绝冲数组", description: "样例解读", occurrences: 2 }],
    };
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/shuzi-guilv/chart");
      return new Response(JSON.stringify(chart), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const app = await setup(fetchMock);
    const createdResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/shuzi-guilv/chart", payload: request });
    const created = ShuziGuilvChartWithReferenceSchema.parse(createdResponse.json());
    const restoredResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/shuzi-guilv/context", payload: { paipan_ref: created.paipan_ref } });
    const restored = ShuziGuilvContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.interpretations[0]?.occurrences).toBe(2);
  });

  it("creates and restores a nine-palace flying-star chart", async () => {
    const request: XuankongFeixingChartRequest = { chartDateTime: "2024-02-04 12:00", fortunePeriod: 9, orientation: "子山午向", method: "base", note: "黄金样例" };
    const trigrams = ["坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"] as const;
    const directions = ["北方", "西南", "东方", "东南", "中央", "西北", "西方", "东北", "南方"] as const;
    const elements = ["水", "土", "木", "木", "土", "金", "金", "土", "火"] as const;
    const stars = ["贪狼星", "巨门星", "禄存星", "文曲星", "廉贞星", "武曲星", "破军星", "左辅星", "右弼星"];
    const chart = {
      overview: { chartDateTime: request.chartDateTime, lunarDate: "癸卯年乙丑月戊戌日午时", fortunePeriod: 9, fortuneLabel: "九运", orientation: request.orientation, method: "base", methodLabel: "下盘", note: request.note },
      directions: ["子山", "艮", "震", "巽", "午向", "坤", "兑", "乾"],
      palaces: Array.from({ length: 9 }, (_, index) => ({
        index: index + 1, trigram: trigrams[index]!, direction: directions[index]!, element: elements[index]!, star: stars[index]!,
        fortuneStar: ((index + 4) % 9) + 1, mountainStar: 9 - index, facingStar: index + 1,
        annualStar: ((index + 8) % 9) + 1, monthlyStar: ((index + 1) % 9) + 1, dailyStar: ((index + 3) % 9) + 1, hourlyStar: ((index + 5) % 9) + 1,
        mountainPosition: index === 0 ? "子" : null, facingPosition: index === 8 ? "午" : null,
        interpretations: { combination: "山向解读", fortune: "运星解读", mountain: "山星解读", facing: "向星解读", annual: "年星解读" },
      })),
    };
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://paipan.test/internal/v1/xuankong-feixing/chart");
      return new Response(JSON.stringify(chart), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const app = await setup(fetchMock);
    const createdResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/xuankong-feixing/chart", payload: request });
    const created = XuankongFeixingChartWithReferenceSchema.parse(createdResponse.json());
    const restoredResponse = await app.inject({ method: "POST", url: "/api/v1/paipan/xuankong-feixing/context", payload: { paipan_ref: created.paipan_ref } });
    const restored = XuankongFeixingContextResponseSchema.parse(restoredResponse.json());
    expect(restored.chartRequest).toEqual(request);
    expect(restored.chart.palaces).toHaveLength(9);
  });
});
