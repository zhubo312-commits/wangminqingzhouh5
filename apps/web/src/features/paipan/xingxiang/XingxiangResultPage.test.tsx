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
const transformations = [
  { transformation: "禄", star: "巨门" },
  { transformation: "权", star: "太阳" },
  { transformation: "科", star: "文曲" },
  { transformation: "忌", star: "文昌" },
] as const;
const annuals = Array.from({ length: 10 }, (_, index) => ({
  age: 5 + index,
  year: 1993 + index,
  ganZhi: "癸酉",
  palaceNames: dynamicNames,
  transformations,
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
      { name: "文昌", category: "soft", brightness: "得", natalTransformation: "科" },
      { name: "地劫", category: "tough", brightness: "庙", natalTransformation: null },
      { name: "红鸾", category: "flower", brightness: "", natalTransformation: null },
      { name: "天官", category: "support", brightness: "", natalTransformation: null },
    ] : [],
    selfTransformations: branch === "巳" ? [{ transformation: "禄", star: "天同", inward: true }] : [],
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

  it("keeps the traditional ring and reveals details in the nearest directional band", () => {
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
    expect(document.querySelector(".xingxiang-period-detail")).not.toBeInTheDocument();

    fireEvent.click(firstPeriod);
    expect(firstPeriod).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-period-row="0"] > .xingxiang-period-detail')).toBeVisible();
    expect(document.querySelector('[data-period-row="1"] > .xingxiang-period-detail')).not.toBeInTheDocument();
    const firstAnnual = within(periodBoard).getByRole("button", { name: /1993.*癸酉.*5岁/ });
    const secondAnnual = within(periodBoard).getByRole("button", { name: /1994.*癸酉.*6岁/ });
    expect(firstAnnual).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(secondAnnual);
    expect(secondAnnual).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(secondRowPeriod);
    expect(secondRowPeriod).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector('[data-period-row="0"] > .xingxiang-period-detail')).not.toBeInTheDocument();
    expect(document.querySelector('[data-period-row="1"] > .xingxiang-period-detail')).toBeVisible();
    fireEvent.click(secondRowPeriod);
    expect(secondRowPeriod).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".xingxiang-period-detail")).not.toBeInTheDocument();

    const grid = screen.getByLabelText("十二宫星盘");
    expect(within(grid).getAllByRole("button")).toHaveLength(12);
    expect(within(grid).getByRole("group", { name: "命盘摘要" })).toBeVisible();

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
    expect(document.querySelector(".xingxiang-detail-slot.upper #xingxiang-palace-detail.slide-down")).toBeVisible();
    const detail = document.querySelector("#xingxiang-palace-detail")!;
    expect(within(detail as HTMLElement).getByRole("heading", { name: "夫妻宫" })).toBeVisible();
    expect(within(detail as HTMLElement).getByText("主星")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("辅曜")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("煞曜")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("禄马桃花")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("杂曜")).toBeVisible();
    expect(within(detail as HTMLElement).getByText("宫干自化")).toBeVisible();
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

    fireEvent.click(screen.getByRole("button", { name: "放大查看" }));
    const dialog = screen.getByRole("dialog", { name: /测试.*辛未大限.*癸酉流年/ });
    expect(within(dialog).getByRole("button", { name: "关闭放大查看" })).toBeVisible();
    expect(dialog.querySelector(".xingxiang-dialog-panel")).toBeVisible();
    expect(dialog.querySelector(".xingxiang-dialog-scroll")).toBeVisible();
    expect(within(dialog).getByRole("group", { name: "命盘摘要" })).toBeVisible();
    expect(within(dialog).getByLabelText("十二宫星盘")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭放大查看" }));
    fireEvent.click(screen.getByRole("button", { name: "重新排盘" }));
    expect(screen.getByText("星像表单页")).toBeVisible();
  });
});
