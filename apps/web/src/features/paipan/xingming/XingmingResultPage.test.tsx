import { XingmingChartResponseSchema, type XingmingChartResponse } from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XingmingResultPage } from "./XingmingResultPage";
import { useXingmingSession } from "./XingmingSession";

vi.mock("./XingmingSession", () => ({ useXingmingSession: vi.fn() }));

const reading = (number: number, rating: string, summary: string | null = null) => ({ number, yinYang: "阳", rating, summary, categories: "吉祥运", foundation: "木星", family: "家门余庆", health: "易患脑溢血、胃肠与肾脏疾病", meaning: summary, detail: summary });
const usageReference = { recommendationPercent: 95, culturePercent: 94, genderTendency: 3, usageCount: 1000, firstCharacterPercent: 84, malePercent: 47, femalePercent: 53, sourceNote: "来源站统计，仅作用字参考，不参与姓名学评分。" };
const character = (input: string, traditional: string, strokes: number, element: "金" | "木" | "水" | "火" | "土") => ({ input, simplified: input, traditional, pinyin: "chén", radical: "辰", kangxiStrokes: strokes, calculationStrokes: strokes, element, rating: "吉", common: true, nameUsageClass: "姓名学", nameExplanation: "时辰，星辰。", namingMeaning: "指时日、星月。", namingImplication: "希望、吉祥。", taboos: "避免同韵字。", usageReference });
const grid = (key: "heaven" | "person" | "earth" | "outer" | "total" | "change", label: "天格" | "人格" | "地格" | "外格" | "总格" | "变格", number: number, element: "金" | "木" | "水" | "火" | "土", rating: string) => ({ key, label, number, interpretationNumber: number, element, rating, interpretation: reading(number, rating, number === 15 ? "（福寿）福寿圆满，富贵荣誉。" : `（${number}数）${number}数的传统含义。`) });

function chart(school: "wuge" | "liuge"): XingmingChartResponse {
  const liuge = school === "liuge";
  return XingmingChartResponseSchema.parse({
    dataset: { status: "official", version: "xingming-20260814.r1", dictionaryVersion: "kangxi-cn-20260813.r3", numerologyVersion: "yp-20260813.r1" },
    school,
    name: liuge ? { surname: "歐陽", givenName: "子涵", fullName: "歐陽子涵" } : { surname: "李", givenName: "明", fullName: "李明" },
    characters: liuge ? [character("欧", "歐", 15, "土"), character("阳", "陽", 17, "土"), character("子", "子", 3, "水"), character("涵", "涵", 12, "水")] : [character("李", "李", 7, "火"), character("明", "明", 8, "水")],
    grids: liuge ? [grid("heaven", "天格", 32, "木", "吉"), grid("person", "人格", 20, "水", "凶"), grid("earth", "地格", 15, "土", "吉"), grid("outer", "外格", 27, "金", "半吉半凶"), grid("total", "总格", 47, "金", "吉"), grid("change", "变格", 29, "水", "半吉半凶")] : [grid("heaven", "天格", 8, "金", "吉"), grid("person", "人格", 15, "土", "大吉"), grid("earth", "地格", 9, "水", "凶"), grid("outer", "外格", 2, "木", "凶"), grid("total", "总格", 15, "土", "大吉")],
    threeTalents: { title: liuge ? "木水土" : "金土水", rating: "吉", summary: "健康易患胃肠、肾脏疾病，老运感叹人情冷暖凄凉。", foundationLuck: "基础安定", foundationRating: "吉", successLuck: "成功顺利", successRating: "吉", relationships: "人际圆融", relationshipsRating: "吉", personality: "性情稳健", liugeSummary: liuge ? "六格参考" : null, liugeRating: liuge ? "吉" : null },
    elementRelations: [{ from: "天格", to: "人格", relation: "相生", summary: "天格 → 人格：相生" }, { from: "人格", to: "地格", relation: "相克", summary: "人格 → 地格：相克" }],
    score: liuge ? 72 : 68,
    scoreBreakdown: { components: [{ key: "heaven", label: "天格", weightPercent: 20, rawScore: 70, contribution: 14 }, { key: "earth", label: "地格", weightPercent: 20, rawScore: 72, contribution: 14 }, { key: "person", label: "人格", weightPercent: 20, rawScore: 90, contribution: 18 }, { key: "threeTalents", label: "三才", weightPercent: 40, rawScore: 55, contribution: 22 }], total: liuge ? 72 : 68, note: "仅作传统姓名学参考" },
    totalGridDescription: reading(liuge ? 47 : 15, "吉", "福寿圆满，富贵荣誉。"),
  });
}

function mockSession(value: XingmingChartResponse) {
  vi.mocked(useXingmingSession).mockReturnValue({ draft: { surname: value.name.surname, givenName: value.name.givenName, school: value.school }, setDraft: vi.fn(), chart: value, chartRequest: { surname: value.name.surname, givenName: value.name.givenName, school: value.school }, isRestoring: false, setResult: vi.fn() });
}
function renderResult() { render(<MemoryRouter initialEntries={["/paipan/xingming/result"]}><Routes><Route path="/paipan/xingming/result" element={<XingmingResultPage />} /></Routes></MemoryRouter>); }

describe("XingmingResultPage", () => {
  beforeEach(() => mockSession(chart("wuge")));
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("renders the layered five-grid result without internal dataset notes", () => {
    renderResult();
    expect(screen.getByRole("heading", { name: "李明" })).toBeVisible();
    expect(screen.queryByText(/正式康熙字库/)).not.toBeInTheDocument();
    expect(screen.queryByText(/kangxi-cn-/)).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("姓名用字信息")).getAllByRole("article")).toHaveLength(2);
    expect(within(screen.getByLabelText("姓氏 李")).getAllByRole("article")).toHaveLength(1);
    expect(within(screen.getByLabelText("名字 明")).getAllByRole("article")).toHaveLength(1);
    const givenNameCharacter = screen.getByLabelText("名字用字 明");
    expect(within(givenNameCharacter).getByText("拼音")).toBeVisible();
    expect(within(givenNameCharacter).getByText("简体字")).toBeVisible();
    expect(within(givenNameCharacter).getByText("繁体字")).toBeVisible();
    expect(within(givenNameCharacter).getByText("笔画（计入）")).toBeVisible();
    expect(within(givenNameCharacter).getByText("康熙笔画")).toBeVisible();
    expect(within(givenNameCharacter).getByLabelText("五行 水")).toBeVisible();
    expect(screen.getByLabelText("五格关系图")).toBeVisible();
    expect(document.querySelectorAll("[data-xingming-grid]")).toHaveLength(5);
    expect(within(screen.getByLabelText("五格关系图")).getAllByLabelText(/^五行 /)).toHaveLength(5);
    expect(screen.getByLabelText("三才五行 金土水")).toBeVisible();
    const threeTalents = screen.getByLabelText("三才五行 金土水");
    expect(within(threeTalents).getAllByLabelText(/^五行 /)).toHaveLength(3);
    expect(within(threeTalents).getByText("天格")).toBeVisible();
    expect(within(threeTalents).getByText("人格")).toBeVisible();
    expect(within(threeTalents).getByText("地格")).toBeVisible();
    expect(screen.getByText("三才五行").nextElementSibling).toHaveTextContent("吉");
    expect(screen.getAllByLabelText("虚位一画")).toHaveLength(2);
    expect(screen.getAllByText(/福寿圆满/).length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".xingming-grids-card details[open]")).toHaveLength(5);
    expect(screen.queryByText("数理摘要")).not.toBeInTheDocument();
    expect(screen.queryByText("传统分类")).not.toBeInTheDocument();
    expect(screen.getByText(/天格由姓氏笔画计算/)).toBeVisible();
    expect(screen.getByText(/人格连接姓和名，是五格中的核心/)).toBeVisible();
    expect(screen.queryByText(/男性双妻运|刚情运|常见说法/)).not.toBeInTheDocument();
    expect(document.querySelector(".xingming-grid-duplicate")).toHaveTextContent("同为 15 数，含义与人格相同，本处不重复");
    expect(screen.getAllByText("福寿")).toHaveLength(1);
    expect(screen.queryByText("评分构成")).not.toBeInTheDocument();
    expect(screen.queryByText(/脑溢血|胃肠与肾脏|人情冷暖凄凉/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "调整姓名" }));
    expect(screen.getByLabelText("姓氏")).toHaveValue("李");
    expect(screen.getByLabelText("名字")).toHaveValue("明");
    expect(screen.getByText(/可手动调整姓氏和名字/)).toBeVisible();
  });
  it("renders normalized traditional characters and the sixth grid", () => {
    mockSession(chart("liuge")); renderResult();
    expect(screen.getByRole("heading", { name: "歐陽子涵" })).toBeVisible();
    expect(within(screen.getByLabelText("姓氏 歐陽")).getAllByRole("article")).toHaveLength(2);
    expect(within(screen.getByLabelText("名字 子涵")).getAllByRole("article")).toHaveLength(2);
    const normalizedCharacter = screen.getByLabelText("姓氏用字 陽");
    expect(within(normalizedCharacter).getByText("阳")).toBeVisible();
    expect(within(normalizedCharacter).getAllByText("陽")).toHaveLength(2);
    expect(screen.getByText("变格")).toBeVisible();
    expect(screen.getByLabelText("六格关系图")).toBeVisible();
    expect(document.querySelectorAll("[data-xingming-grid]")).toHaveLength(6);
    expect(document.querySelectorAll(".xingming-grids-card details[open]")).toHaveLength(6);
  });
  it("lays out up to three given-name characters in one row and emphasizes Kangxi strokes", () => {
    const value = chart("wuge");
    const threeCharacterName = XingmingChartResponseSchema.parse({
      ...value,
      name: { surname: "李", givenName: "明華光", fullName: "李明華光" },
      characters: [value.characters[0], value.characters[1], character("华", "華", 12, "水"), character("光", "光", 6, "火")],
    });
    mockSession(threeCharacterName); renderResult();
    const givenNameGroup = screen.getByLabelText("名字 明華光");
    expect(within(givenNameGroup).getAllByRole("article")).toHaveLength(3);
    expect(givenNameGroup.querySelector(".xingming-name-character-list")).toHaveClass("xingming-name-character-list--3");
    expect(within(screen.getByLabelText("名字用字 華")).getByText("康熙笔画")).toBeVisible();
    expect(screen.getByLabelText("名字用字 華").querySelector(".xingming-kangxi-strokes strong")).toHaveTextContent("12");
  });
});
