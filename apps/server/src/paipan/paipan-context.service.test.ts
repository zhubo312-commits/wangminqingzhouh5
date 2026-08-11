import type { BaziChartRequest, BaziChartResponse } from "@guoxue/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { GoneAppError, NotFoundAppError } from "../shared/errors/app-error.js";
import { PaipanContextRepository, hashPaipanReference } from "./paipan-context.repository.js";
import { PaipanContextService } from "./paipan-context.service.js";

const chartRequest: BaziChartRequest = {
  name: "",
  gender: "male",
  birthDateTime: "1990-01-01 12:00",
  areaCode: "110101",
  useTrueSolarTime: false,
};

const pillar = (key: "year" | "month" | "day" | "hour", label: string) => ({
  key,
  label,
  stem: "甲",
  branch: "子",
  stemElement: "木",
  branchElement: "水",
  tenGod: "正印",
  hiddenStems: [{ stem: "癸", element: "水", tenGod: "正官" }],
  growth: "长生",
  selfSeat: "沐浴",
  naYin: "海中金",
  voidBranch: "戌亥",
  shenSha: ["天乙贵人"],
});

const chart: BaziChartResponse = {
  profile: {
    name: "",
    gender: "male",
    birthDateTime: "1990-01-01 12:00",
    lunarDate: "一九八九年腊月初五日午时",
    area: "北京市东城",
    areaCode: "110101",
    chineseZodiac: "蛇",
    zodiac: "摩羯",
  },
  basicFacts: {
    benMingFo: "普贤菩萨",
    taiYuan: "丁卯",
    taiYuanNaYin: "炉中火",
    mingGong: "乙亥",
    mingGongNaYin: "山头火",
    duiChong: "猴",
    sanSha: "北",
    wenChangWei: "西",
    prevSolarTerm: "1989-12-22 05:22:00 冬至",
    nextSolarTerm: "1990-01-05 22:33:14 小寒",
  },
  pillars: [
    pillar("year", "年柱"),
    pillar("month", "月柱"),
    pillar("day", "日柱"),
    pillar("hour", "时柱"),
  ],
  attention: { heavenlyStems: [], earthlyBranches: [] },
  shenShaDescriptions: {},
  fortune: {
    startSolar: "1998-05-01 12:00:00",
    startDescription: "出生后起运",
    changeDescription: "按节气交运",
    periods: [],
  },
  strength: {
    legacyScore: 52,
    samePartyScore: 350,
    otherPartyScore: 260,
    level: "日主偏旺，身强",
    pattern: "扶抑格",
    summary: "日主偏旺。",
    favorableGod: "食伤",
    favorableElements: ["土", "金", "水"],
    relationScores: { 食伤: 90 },
  },
};

let database: DatabaseContext | null = null;

afterEach(() => {
  database?.close();
  database = null;
});

describe("PaipanContextService", () => {
  it("creates one Dify-friendly reference and resolves the complete typed context", () => {
    database = createDatabase(":memory:");
    const repository = new PaipanContextRepository(database);
    const service = new PaipanContextService(repository, 7_200);
    const now = new Date("2026-08-11T02:00:00.000Z");

    const result = service.create(chartRequest, chart, now);
    expect(result.paipan_ref).toMatch(/^pp_[A-Za-z0-9_-]{32}$/);
    expect(result.expiresAt).toBe("2026-08-11T04:00:00.000Z");
    expect(
      database.raw
        .prepare("SELECT reference_hash FROM paipan_contexts")
        .get(),
    ).toEqual({ reference_hash: hashPaipanReference(result.paipan_ref) });

    const context = service.resolve(result.paipan_ref, new Date("2026-08-11T03:00:00.000Z"));
    expect(context).toMatchObject({
      schemaVersion: "guoxue.paipan.bazi.v1",
      chartType: "shengping_zishi",
      paipan_ref: result.paipan_ref,
      chartRequest,
      chart: { profile: { areaCode: "110101" } },
    });
  });

  it("returns explicit not-found and expired errors", () => {
    database = createDatabase(":memory:");
    const service = new PaipanContextService(new PaipanContextRepository(database), 300);
    expect(() => service.resolve(`pp_${"a".repeat(32)}`)).toThrow(NotFoundAppError);

    const result = service.create(chartRequest, chart, new Date("2026-08-11T02:00:00.000Z"));
    expect(() =>
      service.resolve(result.paipan_ref, new Date("2026-08-11T02:05:01.000Z")),
    ).toThrow(GoneAppError);
  });
});
