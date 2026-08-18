import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createXingmingChart } from "../../../lib/api-client";
import { useXingmingSession } from "../xingming/XingmingSession";
import { KangxiFormPage } from "./KangxiFormPage";

vi.mock("../xingming/XingmingSession", () => ({ useXingmingSession: vi.fn() }));
vi.mock("../../../lib/api-client", () => ({ createXingmingChart: vi.fn() }));

describe("KangxiFormPage", () => {
  const setDraft = vi.fn();
  const setResult = vi.fn();

  function mockDraft(surname = "", givenName = "") {
    vi.mocked(useXingmingSession).mockReturnValue({
      draft: { surname, givenName, school: "wuge" },
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult,
    });
  }

  beforeEach(() => mockDraft());
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows only the name lookup form", () => {
    render(<MemoryRouter><KangxiFormPage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "康熙字典" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "姓名" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /三才五格|三才六格/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /观复字库/ })).not.toBeInTheDocument();
  });

  it("splits a compound surname with the shared longest-prefix rule", () => {
    render(<MemoryRouter><KangxiFormPage /></MemoryRouter>);
    fireEvent.change(screen.getByRole("textbox", { name: "姓名" }), { target: { value: "欧阳子涵" } });

    const updater = setDraft.mock.calls[0]?.[0];
    expect(typeof updater).toBe("function");
    expect(updater({ surname: "", givenName: "", school: "liuge" })).toEqual({
      surname: "欧阳",
      givenName: "子涵",
      school: "wuge",
    });
  });

  it("validates missing, non-Han, and overlong names locally", () => {
    const { rerender } = render(<MemoryRouter><KangxiFormPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "查询姓名用字" }));
    expect(screen.getByRole("alert")).toHaveTextContent("姓名请填写 2 至 5 个汉字");

    mockDraft("L", "i");
    rerender(<MemoryRouter><KangxiFormPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "查询姓名用字" }));
    expect(screen.getByRole("alert")).toHaveTextContent("姓名请填写 2 至 5 个汉字");

    mockDraft("李", "明华光远");
    rerender(<MemoryRouter><KangxiFormPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "查询姓名用字" }));
    expect(screen.getByRole("alert")).toHaveTextContent("名字请填写 1 至 3 个汉字");
    expect(createXingmingChart).not.toHaveBeenCalled();
  });

  it("submits exactly once with the fixed five-grid request", async () => {
    mockDraft("李", "明");
    let resolveResponse!: (value: Awaited<ReturnType<typeof createXingmingChart>>) => void;
    vi.mocked(createXingmingChart).mockReturnValue(new Promise((resolve) => { resolveResponse = resolve; }));
    render(<MemoryRouter><KangxiFormPage /></MemoryRouter>);

    const button = screen.getByRole("button", { name: "查询姓名用字" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(createXingmingChart).toHaveBeenCalledTimes(1);
    expect(createXingmingChart).toHaveBeenCalledWith({ surname: "李", givenName: "明", school: "wuge" });
    expect(screen.getByRole("button", { name: "正在查询…" })).toBeDisabled();

    const reference = `pp_${"k".repeat(32)}`;
    resolveResponse({ paipan_ref: reference, expiresAt: "2030-01-01T00:00:00.000Z" } as Awaited<ReturnType<typeof createXingmingChart>>);
    await waitFor(() => expect(setResult).toHaveBeenCalledWith({}, { surname: "李", givenName: "明", school: "wuge" }, reference));
  });

  it("surfaces the upstream missing-character message and restores the form", async () => {
    mockDraft("㐀", "明");
    vi.mocked(createXingmingChart).mockRejectedValue(new Error("正式康熙字库尚未收录“㐀”字"));
    render(<MemoryRouter><KangxiFormPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "查询姓名用字" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("正式康熙字库尚未收录“㐀”字");
    expect(screen.getByRole("button", { name: "查询姓名用字" })).toBeEnabled();
  });
});
