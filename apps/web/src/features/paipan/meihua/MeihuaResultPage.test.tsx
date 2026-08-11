import { MeihuaChartResponseSchema, type MeihuaChartRequest } from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MeihuaResultPage } from "./MeihuaResultPage";
import { useMeihuaSession } from "./MeihuaSession";

vi.mock("./MeihuaSession", () => ({ useMeihuaSession: vi.fn() }));

const request: MeihuaChartRequest = { chartDateTime: "2026-08-11 21:31", mode: "time" };
const trigram = (index: number, key: "qian" | "dui" | "li" | "xun" | "kan", name: "乾" | "兑" | "离" | "巽" | "坎", symbol: "☰" | "☱" | "☲" | "☴" | "☵", element: "金" | "木" | "水" | "火", lines: Array<"yin" | "yang">) => ({ index, key, name, symbol, element, lines });
const chart = MeihuaChartResponseSchema.parse({
  overview: {
    method: "时间起盘",
    solarDateTime: "2026-08-11 21:31",
    lunarDate: "丙午年六月廿九日亥时",
    pillars: { year: "丙午", month: "丙申", day: "丁巳", hour: "辛亥" },
    voidBranches: "子丑",
    includeHour: false,
  },
  upperTrigram: 2,
  lowerTrigram: 6,
  movingLine: 6,
  original: { key: "duikan", name: "泽水困", upper: trigram(2, "dui", "兑", "☱", "金", ["yin", "yang", "yang"]), lower: trigram(6, "kan", "坎", "☵", "水", ["yin", "yang", "yin"]), lines: ["yin", "yang", "yin", "yang", "yang", "yin"] },
  mutual: { key: "xunli", name: "风火家人", upper: trigram(5, "xun", "巽", "☴", "木", ["yang", "yang", "yin"]), lower: trigram(3, "li", "离", "☲", "火", ["yang", "yin", "yang"]), lines: ["yang", "yin", "yang", "yin", "yang", "yang"] },
  changed: { key: "qiankan", name: "天水讼", upper: trigram(1, "qian", "乾", "☰", "金", ["yang", "yang", "yang"]), lower: trigram(6, "kan", "坎", "☵", "水", ["yin", "yang", "yin"]), lines: ["yin", "yang", "yin", "yang", "yang", "yang"] },
});

describe("MeihuaResultPage", () => {
  beforeEach(() => {
    vi.mocked(useMeihuaSession).mockReturnValue({
      draft: {} as never,
      setDraft: vi.fn(),
      chart,
      chartRequest: request,
      isRestoring: false,
      setResult: vi.fn(),
    });
  });

  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows the three hexagrams, moving line and full classic details", () => {
    render(<MemoryRouter initialEntries={["/paipan/meihua/result"]}><Routes><Route path="/paipan/meihua/result" element={<MeihuaResultPage />} /><Route path="/paipan/meihua" element={<div>梅花表单页</div>} /></Routes></MemoryRouter>);

    expect(screen.getAllByRole("heading", { name: "泽水困" })[0]).toBeVisible();
    expect(screen.getByText("本卦 · 互卦 · 变卦")).toBeVisible();
    expect(screen.getAllByText("查看卦辞与爻辞")).toHaveLength(3);
    expect(document.querySelectorAll(".meihua-lines .moving")).toHaveLength(1);
    fireEvent.click(screen.getAllByText("查看卦辞与爻辞")[0]!);
    expect(screen.getByRole("dialog", { name: "泽水困" })).toBeVisible();
    expect(screen.getByText("卦辞")).toBeVisible();
    expect(screen.getByRole("dialog", { name: "泽水困" }).querySelectorAll(".meihua-classic-lines section")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "关闭卦象原文" }));
    fireEvent.click(screen.getByRole("button", { name: /重新起盘或查阅六十四卦/ }));
    expect(screen.getByText("梅花表单页")).toBeVisible();
  });
});
