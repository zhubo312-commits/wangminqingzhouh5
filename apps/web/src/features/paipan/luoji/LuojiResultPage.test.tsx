import { LuojiChartResponseSchema, type LuojiChartRequest } from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LuojiResultPage } from "./LuojiResultPage";
import { useLuojiSession } from "./LuojiSession";

vi.mock("./LuojiSession", () => ({ useLuojiSession: vi.fn() }));

const request: LuojiChartRequest = { chartDateTime: "2026-08-11 21:31", question: "项目安排", mode: "backs", coinBacks: "312101" };
const originalLines = ["yang", "yin", "yang", "yin", "yang", "yang"] as const;
const changedLines = ["yang", "yang", "yang", "yin", "yang", "yin"] as const;
const deities = ["青龙", "玄武", "白虎", "螣蛇", "勾陈", "朱雀"] as const;
const originalKin = ["父母", "兄弟", "子孙", "兄弟", "官鬼", "父母"] as const;
const originalGz = ["己巳", "己未", "己酉", "丁丑", "丁卯", "丁巳"] as const;
const changedKin = ["兄弟", "子孙", "父母", "父母", "兄弟", "官鬼"] as const;
const changedGz = ["壬戌", "壬申", "壬午", "戊午", "戊辰", "戊寅"] as const;
const element = (value: string) => "巳午".includes(value[1] ?? "") ? "火" : "申酉".includes(value[1] ?? "") ? "金" : "寅卯".includes(value[1] ?? "") ? "木" : "子亥".includes(value[1] ?? "") ? "水" : "土";
const chart = LuojiChartResponseSchema.parse({
  overview: { method: "硬币背数法", question: "项目安排", solarDateTime: "2026-08-11 21:31", lunarDate: "丙午年丙申月丁巳日辛亥时", pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" }, voidBranches: "子丑", coinBacks: "312101" },
  original: { name: "火泽睽", upperTrigram: "离", lowerTrigram: "兑", lines: originalLines, palace: { name: "艮宫", sequence: 5, type: null, element: "土" }, shiLine: 4, yingLine: 1 },
  changed: { name: "天水讼", upperTrigram: "乾", lowerTrigram: "坎", lines: changedLines, palace: { name: "离宫", sequence: 7, type: "游魂", element: "火" }, shiLine: 4, yingLine: 1 },
  lines: originalLines.map((originalLine, index) => ({ position: 6 - index, deity: deities[index], hiddenKin: index === 1 ? "妻财" : null, hiddenStemBranch: index === 1 ? "丙子" : null, originalKin: originalKin[index], originalStemBranch: originalGz[index], originalElement: element(originalGz[index]!), originalLine, isMoving: index === 1 || index === 5, marker: index === 2 ? "世" : index === 5 ? "应" : null, changedKin: changedKin[index], changedStemBranch: changedGz[index], changedElement: element(changedGz[index]!), changedLine: changedLines[index] })),
});

describe("LuojiResultPage", () => {
  beforeEach(() => vi.mocked(useLuojiSession).mockReturnValue({ draft: {} as never, setDraft: vi.fn(), chart, chartRequest: request, isRestoring: false, setResult: vi.fn() }));
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows six gods, hidden spirit, moving lines and Shi/Ying markers", () => {
    render(<MemoryRouter initialEntries={["/paipan/luoji/result"]}><Routes><Route path="/paipan/luoji/result" element={<LuojiResultPage />} /><Route path="/paipan/luoji" element={<div>逻辑表单页</div>} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /火泽睽.*天水讼/ })).toBeVisible();
    expect(document.querySelectorAll(".luoji-line-row")).toHaveLength(6);
    expect(document.querySelectorAll(".luoji-line-row.moving")).toHaveLength(2);
    expect(screen.getByText("伏 妻财 丙子")).toBeVisible();
    expect(screen.getAllByText("世")).toHaveLength(2);
    expect(screen.getAllByText("应")).toHaveLength(2);
    expect(screen.getByText(/离宫 · 7 · 游魂/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "重新起盘" }));
    expect(screen.getByText("逻辑表单页")).toBeVisible();
  });
});
