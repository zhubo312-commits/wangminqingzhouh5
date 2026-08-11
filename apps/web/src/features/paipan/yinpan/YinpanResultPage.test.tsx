import {
  YinpanChartResponseSchema,
  type YinpanChartRequest,
} from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YinpanResultPage } from "./YinpanResultPage";
import { useYinpanSession } from "./YinpanSession";

vi.mock("./YinpanSession", () => ({
  useYinpanSession: vi.fn(),
}));

const request: YinpanChartRequest = {
  chartDateTime: "2026-08-11 21:31",
  gender: "male",
  question: "测试事项",
  mode: "time",
  lifetime: false,
};

const chart = YinpanChartResponseSchema.parse({
  overview: {
    method: "时盘",
    question: "测试事项",
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
  palaces: Array.from({ length: 9 }, (_, itemIndex) => {
    const index = itemIndex + 1;
    return {
      index,
      trigram: index === 5 ? "中" : "坎",
      direction: index === 5 ? "中央" : "北方",
      element: index === 5 ? "土" : "水",
      deity: index === 5 ? null : "九天",
      star: index === 5 ? null : "天柱",
      door: index === 5 ? null : "开",
      heavenStems: index === 5 ? [] : ["庚"],
      earthStems: ["乙"],
      hiddenStem: index === 5 ? null : "己",
      harms: index === 1 ? [{ symbol: "开", type: "迫" as const }] : [],
      heavenGrowth: index === 1 ? [{ branch: "子", stage: "死" }] : [],
      earthGrowth: index === 1 ? [{ branch: "子", stage: "病" }] : [],
      isVoid: index === 3,
      isHorse: index === 4,
      isChief: index === 6,
      isChiefDoor: index === 7,
    };
  }),
  heavenEarthGates: "子丑寅卯辰巳午未申酉戌亥".split("").map((branch, index) => ({
    branch,
    heavenGate: `天门${index + 1}`,
    earthGate: `地户${index + 1}`,
  })),
  lifetimeChart: null,
});

describe("YinpanResultPage", () => {
  beforeEach(() => {
    vi.mocked(useYinpanSession).mockReturnValue({
      draft: {} as never,
      setDraft: vi.fn(),
      chart,
      chartRequest: request,
      isRestoring: false,
      setResult: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows nine palaces, structural details, gates and zoom actions", () => {
    render(
      <MemoryRouter initialEntries={["/paipan/yinpan-juece/result"]}>
        <Routes>
          <Route path="/paipan/yinpan-juece/result" element={<YinpanResultPage />} />
          <Route path="/paipan/yinpan-juece" element={<div>阴盘表单页</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "阴遁9局" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /坎\d/ })).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /北方 坎1/ }));
    expect(screen.getByText("四害")).toBeVisible();
    expect(screen.getByText("开 · 迫")).toBeVisible();
    expect(screen.getByText("天盘长生")).toBeVisible();

    fireEvent.click(screen.getByText("天门地户"));
    expect(screen.getByText("天门1")).toBeVisible();
    expect(screen.getByText("地户12")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "放大查看" }));
    expect(screen.getByRole("dialog", { name: "阴盘九宫放大图" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "关闭放大查看" }));

    fireEvent.click(screen.getByRole("button", { name: "重新排盘" }));
    expect(screen.getByText("阴盘表单页")).toBeVisible();
  });
});
