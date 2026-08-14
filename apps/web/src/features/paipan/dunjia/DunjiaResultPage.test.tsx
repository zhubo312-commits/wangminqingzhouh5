import {
  DunjiaChartResponseSchema,
  type DunjiaChartRequest,
} from "@guoxue/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DunjiaResultPage } from "./DunjiaResultPage";
import { useDunjiaSession } from "./DunjiaSession";

vi.mock("./DunjiaSession", () => ({
  useDunjiaSession: vi.fn(),
}));

const request: DunjiaChartRequest = {
  chartDateTime: "2026-08-13 13:56",
};

const palaceNames = [
  [1, "坎", "北", "水"],
  [2, "坤", "西南", "土"],
  [3, "震", "东", "木"],
  [4, "巽", "东南", "木"],
  [5, "中", "中", "土"],
  [6, "乾", "西北", "金"],
  [7, "兑", "西", "金"],
  [8, "艮", "东北", "土"],
  [9, "离", "南", "火"],
] as const;

const chart = DunjiaChartResponseSchema.parse({
  overview: {
    method: "转盘-拆补-寄坤二宫",
    solarDateTime: "2026-08-13 13:56",
    lunarDate: "二〇二六年七月初一日",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛未" },
    voidBranches: { year: "寅卯", month: "辰巳", day: "子丑", hour: "戌亥" },
    previousSolarTerm: { name: "立秋", dateTime: "2026-08-07 19:42:40" },
    nextSolarTerm: { name: "处暑", dateTime: "2026-08-23 10:18:46" },
    dunType: "阴",
    juNumber: 5,
    xunShou: "甲辰壬",
    chiefStar: { name: "天蓬", palace: 2 },
    chiefDoor: { name: "休", palace: 6 },
    horse: { trigram: "巽", branch: "巳" },
  },
  palaces: palaceNames.map(([index, trigram, direction, element]) => ({
    index,
    trigram,
    direction,
    element,
    deity: index === 5 ? null : "九天",
    star: index === 5 ? null : "天冲",
    door: index === 5 ? null : "开",
    heavenPlate: index === 4 ? "丁" : index === 5 ? "—" : "庚",
    earthPlate: index === 6 ? "丁" : index === 5 ? "戊" : "癸",
    hiddenStem: index === 5 ? null : "乙",
    isVoid: false,
    isChief: index === 2,
    isChiefDoor: index === 6,
    isHorse: index === 4,
    harms: [],
    heavenGrowth: [],
    earthGrowth: [],
  })),
  heavenEarthGates: "子丑寅卯辰巳午未申酉戌亥".split("").map((branch, index) => ({
    branch,
    heavenGate: `天门${index + 1}`,
    earthGate: `地户${index + 1}`,
  })),
});

describe("DunjiaResultPage", () => {
  beforeEach(() => {
    vi.mocked(useDunjiaSession).mockReturnValue({
      draft: {} as never,
      setDraft: vi.fn(),
      chart,
      chartRequest: request,
      paipanRef: "pp_test",
      isRestoring: false,
      setResult: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("marks the day stem in the pillar and matching heaven plate only", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/paipan/dunjia/result"]}>
        <Routes>
          <Route path="/paipan/dunjia/result" element={<DunjiaResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const pillarMarker = container.querySelector('[data-day-stem-location="pillar"]');
    expect(pillarMarker).toHaveTextContent("丁");

    const heavenMarkers = container.querySelectorAll('[data-day-stem-location="heaven"]');
    expect(heavenMarkers).toHaveLength(1);
    expect(heavenMarkers[0]).toHaveTextContent("丁");

    const matchingHeavenPalace = screen.getByRole("button", { name: /巽4/ });
    expect(matchingHeavenPalace.querySelector('[data-day-stem-location="heaven"]')).toHaveTextContent("丁");

    const matchingEarthOnlyPalace = screen.getByRole("button", { name: /乾6/ });
    expect(matchingEarthOnlyPalace).toHaveTextContent("地丁");
    expect(matchingEarthOnlyPalace.querySelector(".dunjia-day-stem-marker")).toBeNull();
    expect(screen.getByText("日干落宫")).toBeVisible();
  });
});
