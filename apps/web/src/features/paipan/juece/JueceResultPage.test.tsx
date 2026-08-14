import {
  JueceChartResponseSchema,
  type JueceChartRequest,
} from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JueceResultPage } from "./JueceResultPage";
import { useJueceSession } from "./JueceSession";

vi.mock("./JueceSession", () => ({
  useJueceSession: vi.fn(),
}));

const request: JueceChartRequest = {
  chartDateTime: "2026-08-11 16:00",
  time: { mode: "standard" },
  pan: { style: "rotating", centerPalaceMethod: "kun" },
  bureau: { method: "chai_bu" },
  voidBasis: "hour",
};

const chart = JueceChartResponseSchema.parse({
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
        stem: index === 5 ? null : "甲",
        star: index === 5 ? null : "天蓬",
        door: index === 5 ? null : "休门",
        deity: index === 5 ? null : "值符",
      },
      earthPlate: { stem: "戊", star: index === 5 ? "天禽" : "天蓬", door: null, deity: null },
      attached: null,
      hiddenGanZhi: index === 5 ? null : "丙",
      harms: index === 1 ? [{ symbol: "休", type: "迫" as const }] : [],
      heavenGrowth: index === 1 ? [{ branch: "子", stage: "长生" }] : [],
      earthGrowth: index === 1 ? [{ branch: "子", stage: "帝旺" }] : [],
      isVoid: index === 3 || index === 8,
      isHorse: index === 8,
      isChief: index === 2,
      isChiefDoor: index === 6,
    };
  }),
  heavenEarthGates: "子丑寅卯辰巳午未申酉戌亥".split("").map((branch, index) => ({
    branch,
    heavenGate: ["太冲卯", "小吉未", "从魁酉"][index] ?? `天门${index + 1}`,
    earthGate: ["除", "危", "定", "开"][index] ?? `地户${index + 1}`,
  })),
});

describe("JueceResultPage", () => {
  beforeEach(() => {
    vi.mocked(useJueceSession).mockReturnValue({
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

  it("shows structural details, expandable terms, zoom and rechart actions", () => {
    render(
      <MemoryRouter initialEntries={["/paipan/juece/result"]}>
        <Routes>
          <Route path="/paipan/juece/result" element={<JueceResultPage />} />
          <Route path="/paipan/juece" element={<div>时家决策学表单页</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("立秋")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /更多/ }));
    expect(screen.getByText("立秋")).toBeVisible();
    expect(screen.getByText("处暑")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /北 坎1/ }));
    expect(screen.getByText("四害")).toBeVisible();
    expect(screen.getByText("休 · 迫")).toBeVisible();
    expect(screen.getByText("天盘长生")).toBeVisible();
    expect(screen.getByText("子 · 长生")).toBeVisible();
    expect(screen.getByText(/天门地户/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "放大查看" }));
    expect(screen.getByRole("dialog", { name: "九宫主盘放大图" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "关闭放大查看" }));
    expect(screen.queryByRole("dialog", { name: "九宫主盘放大图" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重新排盘" }));
    expect(screen.getByText("时家决策学表单页")).toBeVisible();
  });
});
