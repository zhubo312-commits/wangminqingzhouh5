import {
  YinpanChartResponseSchema,
  type YinpanChartRequest,
} from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

const hiddenStems: Record<number, string | null> = {
  1: "乙", 2: "癸", 3: "丁", 4: "庚", 5: null, 6: "丙", 7: "辛戊", 8: "壬", 9: "己",
};

const gateValues = [
  ["子", "登明亥", "执"], ["丑", "神后子", "破"], ["寅", "大吉丑", "危"],
  ["卯", "功曹寅", "成"], ["辰", "太冲卯", "收"], ["巳", "天罡辰", "开"],
  ["午", "太乙巳", "闭"], ["未", "胜光午", "建"], ["申", "小吉未", "除"],
  ["酉", "传送申", "满"], ["戌", "从魁酉", "平"], ["亥", "河魁戌", "定"],
] as const;

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
      hiddenStem: hiddenStems[index],
      harms: index === 1 ? [{ symbol: "开", type: "迫" as const }] : [],
      heavenGrowth: index === 1 ? [{ branch: "子", stage: "死" }] : [],
      earthGrowth: index === 1 ? [{ branch: "子", stage: "病" }] : [],
      isVoid: index === 3,
      isHorse: index === 4,
      isChief: index === 6,
      isChiefDoor: index === 7,
    };
  }),
  heavenEarthGates: gateValues.map(([branch, heavenGate, earthGate]) => ({ branch, heavenGate, earthGate })),
  lifetimeChart: null,
});

const lifetimeChart = {
  profile: {
    name: "", gender: "male", birthDateTime: "2026-08-11 21:31", lunarDate: "二〇二六年六月廿九日亥时",
    area: "未知", areaCode: "999999", trueSolarTime: null, chineseZodiac: "马", zodiac: "狮子",
  },
  basicFacts: {
    benMingFo: "", taiYuan: "", taiYuanNaYin: "", mingGong: "", mingGongNaYin: "",
    duiChong: "", sanSha: "", wenChangWei: "", prevSolarTerm: "立秋", nextSolarTerm: "处暑",
  },
  pillars: (["year", "month", "day", "hour"] as const).map((key) => ({
    key, label: key, stem: "丙", branch: "午", stemElement: "火", branchElement: "火", tenGod: "比肩",
    hiddenStems: [], growth: "帝旺", selfSeat: "帝旺", naYin: "天河水", voidBranch: "戌亥", shenSha: [],
  })),
  attention: { heavenlyStems: [], earthlyBranches: [] },
  shenShaDescriptions: {},
  fortune: {
    startSolar: "2035-01-23 19:31:00",
    startDescription: "出生后8年5月11天2时起运",
    changeDescription: "",
    periods: [
      { index: 0, startYear: 2026, endYear: 2034, startAge: 1, endAge: 9, ganZhi: "" },
      { index: 1, startYear: 2035, endYear: 2044, startAge: 10, endAge: 19, ganZhi: "丁酉" },
      { index: 2, startYear: 2045, endYear: 2054, startAge: 20, endAge: 29, ganZhi: "戊戌" },
    ].map((period) => ({
      ...period, tenGods: [], growth: "", hiddenStems: "", hiddenStemTenGods: [], wealthStrong: false,
      heavenlyStemAttention: [], earthlyBranchAttention: [], shenSha: [], years: [],
    })),
  },
  strength: {
    legacyScore: 0, samePartyScore: 0, otherPartyScore: 0, level: "日主偏旺，身强",
    pattern: "扶抑格，劫比主导的偏旺格。", summary: "", favorableGod: "", favorableElements: [], relationScores: {},
  },
};

const chartWithLifetime = YinpanChartResponseSchema.parse({ ...chart, lifetimeChart });

function renderResult() {
  return render(
    <MemoryRouter initialEntries={["/paipan/yinpan-juece/result"]}>
      <Routes>
        <Route path="/paipan/yinpan-juece/result" element={<YinpanResultPage />} />
        <Route path="/paipan/yinpan-juece" element={<div>阴盘表单页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

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
    renderResult();

    expect(screen.getByRole("heading", { name: "阴遁9局" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /坎\d/ })).toHaveLength(8);
    const topRowPalace = screen.getByRole("button", { name: /北方 坎4/ });
    fireEvent.click(topRowPalace);
    expect(topRowPalace.closest(".yinpan-orbit-row")?.nextElementSibling).toHaveClass("yinpan-palace-detail");
    expect(screen.getByText("坎4宫")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /北方 坎1/ }));
    expect(screen.getByText("四害")).toBeVisible();
    expect(screen.getByText("开 · 迫")).toBeVisible();
    expect(screen.getByText("天盘长生")).toBeVisible();

    expect(screen.getByLabelText("隐干 己")).toHaveClass("top", "slot-2");
    expect(screen.getByLabelText("隐干 乙")).toHaveClass("bottom", "slot-2");
    expect(screen.getByLabelText("隐干 辛戊")).toHaveClass("right", "slot-2");

    const gateToggle = screen.getByRole("switch", { name: "天门地户" });
    const orbitBoard = screen.getByRole("group", { name: "阴盘九宫盘" });
    expect(orbitBoard.nextElementSibling).toBe(gateToggle);
    expect(gateToggle.nextElementSibling).toHaveClass("juece-chart-actions");
    expect(gateToggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("天罡辰").closest(".yinpan-orbit-gate")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(gateToggle);
    expect(gateToggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("天罡辰").closest(".yinpan-orbit-gate")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("神后子")).toBeInTheDocument();
    expect(screen.getByText("河魁戌")).toBeInTheDocument();
    expect(screen.getByText("天罡辰").closest(".yinpan-orbit-gate")).toHaveClass("top", "slot-1");
    expect(screen.getByText("神后子").closest(".yinpan-orbit-gate")).toHaveClass("bottom", "slot-1");

    fireEvent.click(screen.getByRole("button", { name: "放大查看" }));
    expect(screen.getByRole("dialog", { name: "阴盘九宫放大图" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "关闭放大查看" }));

    fireEvent.click(screen.getByRole("button", { name: "重新排盘" }));
    expect(screen.getByText("阴盘表单页")).toBeVisible();
  });

  it("lays out lifetime facts and fortune periods as readable sections", () => {
    vi.mocked(useYinpanSession).mockReturnValue({
      draft: {} as never,
      setDraft: vi.fn(),
      chart: chartWithLifetime,
      chartRequest: { ...request, lifetime: true },
      isRestoring: false,
      setResult: vi.fn(),
    });
    renderResult();

    expect(screen.getByText("二〇二六年六月廿九日亥时")).toBeVisible();
    expect(screen.getByText("出生后8年5月11天2时起运")).toBeVisible();
    expect(screen.getByText("扶抑格，劫比主导的偏旺格。")).toBeVisible();
    const fortunes = screen.getByRole("list", { name: "大运列表" });
    expect(fortunes).toHaveClass("yinpan-fortune-grid");
    expect(screen.queryByText("左右滑动查看")).not.toBeInTheDocument();
    expect(within(fortunes).getAllByRole("listitem")).toHaveLength(3);
    expect(within(fortunes).getByText("童限")).toBeVisible();
    expect(within(fortunes).getByText("10–19岁")).toBeVisible();
    expect(within(fortunes).getByText("2035–2044")).toBeVisible();
  });
});
