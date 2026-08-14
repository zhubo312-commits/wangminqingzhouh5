import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XingmingFormPage } from "./XingmingFormPage";
import { useXingmingSession } from "./XingmingSession";
import { createXingmingChart } from "../../../lib/api-client";

vi.mock("./XingmingSession", () => ({ useXingmingSession: vi.fn() }));
vi.mock("../../../lib/api-client", () => ({ createXingmingChart: vi.fn() }));

describe("XingmingFormPage", () => {
  const setDraft = vi.fn();
  beforeEach(() => {
    vi.mocked(useXingmingSession).mockReturnValue({
      draft: { surname: "", givenName: "", school: "wuge" },
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult: vi.fn(),
    });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("keeps internal dataset notes out of the form and validates missing names locally", () => {
    render(<MemoryRouter><XingmingFormPage /></MemoryRouter>);
    expect(screen.queryByText(/正式康熙字库/)).not.toBeInTheDocument();
    expect(screen.queryByText(/支持已核验的基础汉字/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "开始排盘" }));
    expect(screen.getByRole("alert")).toHaveTextContent("姓氏请填写 1 至 2 个汉字");
  });

  it("offers both schools without any birth, gender, or area fields", () => {
    render(<MemoryRouter><XingmingFormPage /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /三才五格/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /三才六格/ }));
    expect(setDraft).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("性别")).not.toBeInTheDocument();
    expect(screen.queryByText("出生时间")).not.toBeInTheDocument();
    expect(screen.queryByText("地区")).not.toBeInTheDocument();
  });

  it("splits a full name with a compound surname before submitting", () => {
    render(<MemoryRouter><XingmingFormPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "欧阳子涵" } });
    const updater = setDraft.mock.calls[0]?.[0];
    expect(typeof updater).toBe("function");
    expect(updater({ surname: "", givenName: "", school: "wuge" })).toEqual({ surname: "欧阳", givenName: "子涵", school: "wuge" });
  });

  it("shows an upstream 422 message and restores the submit state", async () => {
    vi.mocked(useXingmingSession).mockReturnValue({
      draft: { surname: "㐀", givenName: "明", school: "wuge" },
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult: vi.fn(),
    });
    vi.mocked(createXingmingChart).mockRejectedValue(new Error("正式康熙字库尚未收录“㐀”字"));
    render(<MemoryRouter><XingmingFormPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "开始排盘" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("正式康熙字库尚未收录“㐀”字");
    expect(screen.getByRole("button", { name: "开始排盘" })).toBeEnabled();
  });
});
