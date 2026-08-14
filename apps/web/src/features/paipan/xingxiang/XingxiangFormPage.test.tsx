import type { XingxiangDraft } from "./XingxiangSession";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SetStateAction } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createXingxiangChart, fetchPaipanAreas } from "../../../lib/api-client";
import { XingxiangFormPage } from "./XingxiangFormPage";
import { useXingxiangSession } from "./XingxiangSession";

vi.mock("../../../lib/api-client", () => ({
  createXingxiangChart: vi.fn(),
  fetchPaipanAreas: vi.fn(),
}));
vi.mock("../bazi/BaziMobilePickers", () => ({
  SolarDateTimePicker: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input aria-label="出生时间" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
  AreaWheelPicker: ({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (value: string) => void }) => (
    <select aria-label="地区" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="110101">北京市东城</option>
      <option value="650100">新疆维吾尔自治区乌鲁木齐市</option>
      <option value="999999">其他地区</option>
    </select>
  ),
}));
vi.mock("./XingxiangSession", () => ({ useXingxiangSession: vi.fn() }));

const reference = `pp_${"b".repeat(32)}`;
let draft: XingxiangDraft;
const setResult = vi.fn();

function testApp() {
  return <MemoryRouter initialEntries={["/paipan/xingxiang"]}><Routes><Route path="/paipan/xingxiang" element={<XingxiangFormPage />} /><Route path="/paipan/xingxiang/result" element={<div>星像结果页</div>} /></Routes></MemoryRouter>;
}

describe("XingxiangFormPage", () => {
  beforeEach(() => {
    draft = { name: "", gender: "male", birthDateTime: "1990-01-01T01:30", areaCode: "110101", useTrueSolarTime: false };
    vi.mocked(useXingxiangSession).mockImplementation(() => ({
      draft,
      setDraft(value: SetStateAction<XingxiangDraft>) {
        draft = typeof value === "function" ? value(draft) : value;
      },
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult,
    }));
    vi.mocked(fetchPaipanAreas).mockResolvedValue([{ label: "北京市", code: "110000", children: [] }]);
    vi.mocked(createXingxiangChart).mockResolvedValue({ paipan_ref: reference, expiresAt: "2026-08-11T03:30:00.000Z" } as never);
  });

  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("submits the selected domestic area and true-solar-time flag", async () => {
    const view = render(testApp());
    await waitFor(() => expect(screen.getByRole("button", { name: "开始排盘" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "测试" } });
    fireEvent.change(screen.getByLabelText("地区"), { target: { value: "650100" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /使用真太阳时/ }));
    view.rerender(testApp());
    fireEvent.click(screen.getByRole("button", { name: "开始排盘" }));

    await waitFor(() => expect(createXingxiangChart).toHaveBeenCalledWith({
      name: "测试",
      gender: "male",
      birthDateTime: "1990-01-01 01:30",
      areaCode: "650100",
      useTrueSolarTime: true,
      school: "flying",
    }));
    expect(setResult).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("星像结果页")).toBeVisible());
  });

  it("blocks the generic other-area fallback when true solar time is enabled", async () => {
    const view = render(testApp());
    await waitFor(() => expect(screen.getByRole("button", { name: "开始排盘" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "测试" } });
    fireEvent.change(screen.getByLabelText("地区"), { target: { value: "999999" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /使用真太阳时/ }));
    view.rerender(testApp());
    fireEvent.click(screen.getByRole("button", { name: "开始排盘" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("真太阳时请选择具体的国内出生地区");
    expect(createXingxiangChart).not.toHaveBeenCalled();
  });
});
