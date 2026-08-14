import type { MeihuaDraft } from "./MeihuaSession";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SetStateAction } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMeihuaChart } from "../../../lib/api-client";
import { MeihuaFormPage } from "./MeihuaFormPage";
import { useMeihuaSession } from "./MeihuaSession";

vi.mock("../../../lib/api-client", () => ({ createMeihuaChart: vi.fn() }));
vi.mock("../bazi/BaziMobilePickers", () => ({
  SolarDateTimePicker: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input aria-label="起盘时间" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock("./MeihuaSession", () => ({ useMeihuaSession: vi.fn() }));

const reference = `pp_${"a".repeat(32)}`;
let draft: MeihuaDraft;
const setResult = vi.fn();

function testApp() {
  return <MemoryRouter initialEntries={["/paipan/meihua"]}><Routes><Route path="/paipan/meihua" element={<MeihuaFormPage />} /><Route path="/paipan/meihua/result" element={<div>梅花结果页</div>} /></Routes></MemoryRouter>;
}

describe("MeihuaFormPage", () => {
  beforeEach(() => {
    draft = {
      chartDateTime: "2026-08-11T20:00",
      numberCount: 2,
      numberOne: "",
      numberTwo: "",
      numberThree: "",
      includeHour: false,
      school: "digit_sum",
      upperTrigram: 1,
      lowerTrigram: 8,
      movingLine: 1,
    };
    vi.mocked(useMeihuaSession).mockImplementation(() => ({
      draft,
      setDraft(value: SetStateAction<MeihuaDraft>) {
        draft = typeof value === "function" ? value(draft) : value;
      },
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult,
    }));
    vi.mocked(createMeihuaChart).mockResolvedValue({ paipan_ref: reference, expiresAt: "2026-08-11T22:00:00.000Z" } as never);
  });

  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("submits all three numbers without calculating the chart in React", async () => {
    const view = render(testApp());
    fireEvent.click(screen.getByRole("button", { name: /报数起盘\s+支持双数与三数起盘/ }));
    view.rerender(testApp());
    fireEvent.click(screen.getByRole("button", { name: "三数起盘" }));
    view.rerender(testApp());

    expect(screen.getByLabelText("第三个数")).toBeVisible();
    fireEvent.change(screen.getByLabelText("第一个数"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("第二个数"), { target: { value: "456" } });
    fireEvent.change(screen.getByLabelText("第三个数"), { target: { value: "788" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /动爻计算加入时辰数/ }));
    view.rerender(testApp());
    fireEvent.click(screen.getByRole("button", { name: "报数起盘" }));

    await waitFor(() => expect(createMeihuaChart).toHaveBeenCalledWith({
      chartDateTime: "2026-08-11 20:00",
      mode: "number",
      numberCount: 3,
      numberOne: 123,
      numberTwo: 456,
      numberThree: 788,
      includeHour: true,
      school: "digit_sum",
    }));
    expect(setResult).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("梅花结果页")).toBeVisible());
  });
});
