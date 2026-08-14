import { XingxiangChartResponseSchema, type XingxiangChartRequest } from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XingxiangResultPage } from "./XingxiangResultPage";
import { useXingxiangSession } from "./XingxiangSession";

vi.mock("./XingxiangSession", () => ({ useXingxiangSession: vi.fn() }));

const request: XingxiangChartRequest = {
  name: "测试",
  gender: "male",
  birthDateTime: "1990-01-01 12:00",
  school: "flying",
};
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const palaceNames = ["交友", "迁移", "疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄"] as const;
const dynamicNames = branches.map((branch, index) => ({ branch, name: palaceNames[index]! }));
const palaceCycle = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"] as const;
function namesForLifePalace(lifeBranch: (typeof branches)[number]) {
  const lifeIndex = branches.indexOf(lifeBranch);
  return branches.map((branch, index) => ({ branch, name: palaceCycle[(lifeIndex - index + 12) % 12]! }));
}
const transformations = [
  { transformation: "禄", star: "巨门", targetBranch: "巳" },
  { transformation: "权", star: "太阳", targetBranch: "亥" },
  { transformation: "科", star: "文曲", targetBranch: "戌" },
  { transformation: "忌", star: "文昌", targetBranch: "辰" },
] as const;
const monthNames = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"] as const;
const monthGanZhi = ["甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥", "甲子", "乙丑"] as const;
const months = branches.map((palaceBranch, index) => ({ monthNumber: index + 1, monthName: monthNames[index]!, ganZhi: monthGanZhi[index]!, palaceBranch }));
const annuals = Array.from({ length: 10 }, (_, index) => ({
  age: 5 + index,
  year: 1993 + index,
  ganZhi: "癸酉",
  palaceNames: namesForLifePalace(branches[index]!),
  transformations,
  months,
}));
const chart = XingxiangChartResponseSchema.parse({
  profile: {
    name: "测试",
    gender: "male",
    genderLabel: "男",
    yinYangGender: "阴男",
    solarDateTime: "1990-01-01 12:00",
    lunarDate: "一九八九年腊月初五日午时",
    fiveElementsBureau: "土五局",
    pillars: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" },
  },
  palaces: branches.map((branch, index) => ({
    branch,
    name: palaceNames[index]!,
    heavenlyStem: "丙",
    bodyPalace: branch === "未",
    zodiacPalace: branch === "巳",
    originPalace: branch === "巳",
    stars: branch === "巳" ? [
      { name: "天同", category: "major", brightness: "平", natalTransformation: "禄" },
      { name: "巨门", category: "major", brightness: "庙", natalTransformation: null },
      { name: "左辅", category: "soft", brightness: "得", natalTransformation: "科" },
      { name: "地劫", category: "tough", brightness: "庙", natalTransformation: null },
      { name: "红鸾", category: "flower", brightness: "", natalTransformation: null },
      { name: "天官", category: "support", brightness: "", natalTransformation: null },
    ] : branch === "亥" ? [{ name: "太阳", category: "major", brightness: "旺", natalTransformation: null }]
      : branch === "戌" ? [{ name: "文曲", category: "soft", brightness: "", natalTransformation: null }]
        : branch === "辰" ? [{ name: "文昌", category: "soft", brightness: "", natalTransformation: null }]
          : [],
    flyingTransformations: transformations,
    selfTransformations: branch === "巳" ? [{ transformation: "禄", star: "天同", targetBranch: "巳", inward: true, direction: "outward" }] : [],
  })),
  periods: Array.from({ length: 12 }, (_, index) => ({
    ganZhi: "辛未",
    startAge: 5 + index * 10,
    endAge: 14 + index * 10,
    startYear: 1993 + index * 10,
    endYear: 2002 + index * 10,
    palaceNames: dynamicNames,
    transformations,
    annuals,
  })),
});

describe("XingxiangResultPage", () => {
  beforeEach(() => {
    vi.mocked(useXingxiangSession).mockReturnValue({
      draft: { name: "测试", gender: "male", birthDateTime: "1990-01-01T12:00" },
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

  it("matches the original default scope and restores the complete interactive palace board", () => {
    render(
      <MemoryRouter initialEntries={["/paipan/xingxiang/result"]}>
        <Routes>
          <Route path="/paipan/xingxiang/result" element={<XingxiangResultPage />} />
          <Route path="/paipan/xingxiang" element={<div>星像表单页</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const periodBoard = screen.getByLabelText("选择大限");
    const firstPeriod = within(periodBoard).getByRole("button", { name: /辛未.*5–14岁/ });
    const secondRowPeriod = within(periodBoard).getByRole("button", { name: /辛未.*45–54岁/ });
    expect(firstPeriod).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-period-row="0"] > .xingxiang-period-detail')).toBeVisible();
    expect(document.querySelector('[data-period-row="1"] > .xingxiang-period-detail')).not.toBeInTheDocument();
    const firstAnnual = within(periodBoard).getByRole("button", { name: /1993.*癸酉.*5岁/ });
    const secondAnnual = within(periodBoard).getByRole("button", { name: /1994.*癸酉.*6岁/ });
    expect(firstAnnual).toHaveAttribute("aria-pressed", "false");
    expect(secondAnnual).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/当前叠加：辛未大限 · 未选择流年/)).toBeVisible();

    const temporalGrid = screen.getByLabelText("运限十二宫星盘");
    expect(within(temporalGrid).getAllByRole("button")).toHaveLength(12);
    expect(temporalGrid.querySelectorAll("button.is-period-life")).toHaveLength(1);
    expect(temporalGrid.querySelectorAll("button.is-annual-life")).toHaveLength(0);
    expect(temporalGrid.querySelectorAll(".xingxiang-palace-scopes .is-period-change")).toHaveLength(12);
    expect(temporalGrid.querySelectorAll(".xingxiang-stars span.is-period-change")).toHaveLength(4);
    expect(within(temporalGrid).getByRole("group", { name: "运限盘摘要" })).toHaveTextContent("运限副盘");

    const grid = screen.getByLabelText("十二宫星盘");
    const boardShell = grid.closest(".xingxiang-board-shell") as HTMLElement;
    for (const direction of ["南偏东", "正南方", "南偏西", "西偏南", "正西方", "西偏北", "北偏西", "正北方", "北偏东", "东偏北", "正东方", "东偏南"]) {
      expect(within(boardShell).getByText(direction)).toBeVisible();
    }

    expect(within(grid).getAllByRole("button")).toHaveLength(12);
    const center = within(grid).getByRole("group", { name: "命盘摘要" });
    expect(center).toHaveTextContent("飞星紫微");
    expect(center).toHaveTextContent("阳历 1990-01-01 12:00");
    expect(center).toHaveTextContent("农历 一九八九年腊月初五日午时");
    expect(center).toHaveTextContent("己巳丙子丙寅甲午");
    const focusLine = grid.querySelector(".xingxiang-four-directions path")!;
    expect(focusLine).toHaveAttribute("d", "M25 100 L75 0");

    fireEvent.click(firstAnnual);
    expect(firstAnnual).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/当前叠加：辛未大限 · 1993年癸酉流年/)).toBeVisible();
    expect(grid.querySelector(".xingxiang-four-directions path")).toHaveAttribute("d", "M75 100 L25 0");
    expect(within(grid).getByText("正月 · 甲寅")).toBeVisible();
    expect(grid.querySelectorAll(".xingxiang-stars em.annual")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "辛未大限 · 1993年癸酉流年星盘" })).toBeVisible();
    expect(temporalGrid.querySelectorAll("button.is-annual-life")).toHaveLength(1);
    expect(temporalGrid.querySelectorAll(".xingxiang-palace-scopes .is-annual-change")).toHaveLength(12);
    expect(temporalGrid.querySelectorAll(".xingxiang-stars span.is-annual-change")).toHaveLength(4);
    expect(temporalGrid.querySelectorAll(".xingxiang-stars em.period")).toHaveLength(4);
    expect(temporalGrid.querySelectorAll(".xingxiang-stars em.annual")).toHaveLength(4);

    const siPalace = within(grid).getByRole("button", { name: /丙巳.*夫妻/ });
    const chenPalace = within(grid).getByRole("button", { name: /丙辰.*子女/ });
    const maoPalace = within(grid).getByRole("button", { name: /丙卯.*财帛/ });
    const yinPalace = within(grid).getByRole("button", { name: /丙寅.*疾厄/ });
    const haiPalace = within(grid).getByRole("button", { name: /丙亥.*官禄/ });
    expect(siPalace).toHaveTextContent("丙巳");
    expect(haiPalace).toHaveTextContent("丙亥");
    expect(siPalace.closest('[data-layout-band="top"]')).toBeVisible();
    expect(chenPalace.closest('[data-layout-band="middle"]')).toBeVisible();
    expect(yinPalace.closest('[data-layout-band="bottom"]')).toBeVisible();
    expect(document.querySelector("#xingxiang-palace-detail")).not.toBeInTheDocument();

    fireEvent.click(siPalace);
    expect(siPalace).toHaveAttribute("aria-expanded", "true");
    expect(grid.querySelector(".xingxiang-four-directions path")).toHaveAttribute("d", "M0 0 L100 100");
    expect(grid.querySelectorAll('.xingxiang-stars span[class*="flying-"]')).toHaveLength(4);
    expect(document.querySelector(".xingxiang-detail-slot.upper #xingxiang-palace-detail.slide-down")).toBeVisible();
    const detail = document.querySelector("#xingxiang-palace-detail")!;
    expect(within(detail as HTMLElement).getByRole("heading", { name: "夫妻宫" })).toBeVisible();
    expect(within(detail as HTMLElement).getByText("主星")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("辅曜")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("煞曜")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("禄马桃花")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("杂曜")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("宫干自化")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("宫干飞化")).toBeVisible();
    expect(within(detail as HTMLElement).getByText(/自化出 · 至巳宫/)).toBeVisible();
    expect(within(detail as HTMLElement).getAllByText("天同")).toHaveLength(2);
    expect(within(detail as HTMLElement).getAllByText("禄")).not.toHaveLength(0);

    fireEvent.click(chenPalace);
    expect(document.querySelector(".xingxiang-detail-slot.upper #xingxiang-palace-detail.slide-up")).toBeVisible();

    fireEvent.click(maoPalace);
    expect(document.querySelector(".xingxiang-detail-slot.lower #xingxiang-palace-detail.slide-down")).toBeVisible();

    fireEvent.click(yinPalace);
    expect(document.querySelector(".xingxiang-detail-slot.bottom #xingxiang-palace-detail.slide-down")).toBeVisible();

    fireEvent.click(yinPalace);
    expect(document.querySelector("#xingxiang-palace-detail")).not.toBeInTheDocument();
    expect(grid.querySelector(".xingxiang-four-directions path")).toHaveAttribute("d", "M75 100 L25 0");

    fireEvent.click(screen.getByRole("button", { name: "放大查看" }));
    const dialog = screen.getByRole("dialog", { name: /测试.*辛未大限.*癸酉流年/ });
    expect(within(dialog).getByRole("button", { name: "关闭放大查看" })).toBeVisible();
    expect(dialog.querySelector(".xingxiang-dialog-panel")).toBeVisible();
    expect(dialog.querySelector(".xingxiang-dialog-scroll")).toBeVisible();
    expect(within(dialog).getByRole("group", { name: "命盘摘要" })).toBeVisible();
    expect(within(dialog).getByLabelText("十二宫星盘")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭放大查看" }));

    fireEvent.click(secondRowPeriod);
    expect(secondRowPeriod).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-period-row="0"] > .xingxiang-period-detail')).not.toBeInTheDocument();
    expect(document.querySelector('[data-period-row="1"] > .xingxiang-period-detail')).toBeVisible();
    expect(screen.getByText(/当前叠加：辛未大限 · 未选择流年/)).toBeVisible();
    expect(within(periodBoard).getAllByRole("button", { pressed: true })).toHaveLength(1);
    fireEvent.click(secondRowPeriod);
    expect(secondRowPeriod).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".xingxiang-period-detail")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重新排盘" }));
    expect(screen.getByText("星像表单页")).toBeVisible();
  });
});
