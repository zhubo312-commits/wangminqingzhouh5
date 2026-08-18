import type { XingmingChartResponse } from "@guoxue/contracts";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useXingmingSession } from "../xingming/XingmingSession";
import { KangxiResultPage } from "./KangxiResultPage";

vi.mock("../xingming/XingmingSession", () => ({ useXingmingSession: vi.fn() }));

const usageReference = {
  recommendationPercent: 95,
  culturePercent: 94,
  genderTendency: 3,
  usageCount: 1000,
  firstCharacterPercent: 84,
  malePercent: 47,
  femalePercent: 53,
  sourceNote: "来源站统计，仅作用字参考。",
};

const chart = {
  school: "wuge",
  name: { surname: "歐", givenName: "明", fullName: "歐明" },
  characters: [
    {
      input: "欧", simplified: "欧", traditional: "歐", pinyin: "ōu", radical: "欠",
      kangxiStrokes: 15, calculationStrokes: 15, element: "土", rating: "吉", common: true,
      nameUsageClass: "姓名学", nameExplanation: "古同讴，歌唱。", namingMeaning: "从容美好。",
      namingImplication: "字形美好。", taboos: null, usageReference,
    },
    {
      input: "明", simplified: "明", traditional: "明", pinyin: "míng", radical: "日",
      kangxiStrokes: 8, calculationStrokes: 8, element: "水", rating: "吉", common: true,
      nameUsageClass: "姓名学", nameExplanation: "明亮，清楚。", namingMeaning: "光明磊落。",
      namingImplication: "聪慧通达。", taboos: null, usageReference,
    },
  ],
  score: 68,
} as XingmingChartResponse;

function mockSession(value: XingmingChartResponse | null, isRestoring = false) {
  vi.mocked(useXingmingSession).mockReturnValue({
    draft: { surname: "欧", givenName: "明", school: "wuge" },
    setDraft: vi.fn(),
    chart: value,
    chartRequest: value ? { surname: "欧", givenName: "明", school: "wuge" } : null,
    isRestoring,
    setResult: vi.fn(),
  });
}

describe("KangxiResultPage", () => {
  beforeEach(() => mockSession(chart));
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("renders normalized character details without numerology content", () => {
    render(<MemoryRouter><KangxiResultPage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "歐明" })).toBeVisible();
    const surname = screen.getByLabelText("姓氏 歐");
    expect(within(surname).getByText("欧", { exact: true })).toBeVisible();
    expect(within(surname).getAllByText("歐", { exact: true })).toHaveLength(3);
    expect(screen.getAllByText("康熙笔画")).toHaveLength(2);
    expect(screen.getByText("部首 欠")).toBeVisible();
    expect(screen.getAllByText("常用字")).toHaveLength(2);
    expect(screen.getByText("字形美好。")).toBeVisible();
    expect(document.querySelectorAll(".kangxi-character-detail-card details[open]")).toHaveLength(2);
    expect(screen.queryByText(/五格数理|六格数理|三才配置|参考分|评分构成/)).not.toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /观复字库/ })).not.toBeInTheDocument();
  });

  it("shows a loading state while restoring the dedicated session", () => {
    mockSession(null, true);
    render(<MemoryRouter><KangxiResultPage /></MemoryRouter>);

    expect(screen.getByRole("status")).toHaveTextContent("正在恢复查字结果");
    expect(screen.queryByRole("link", { name: /观复字库/ })).not.toBeInTheDocument();
  });

  it("shows a recoverable expired state", () => {
    mockSession(null);
    render(<MemoryRouter><KangxiResultPage /></MemoryRouter>);

    expect(screen.getByRole("status")).toHaveTextContent("本次查字结果已失效");
    expect(screen.getByRole("button", { name: "重新查询" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /观复字库/ })).not.toBeInTheDocument();
  });
});
