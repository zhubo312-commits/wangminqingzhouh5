import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LuojiFormPage } from "./LuojiFormPage";
import { useLuojiSession, type LuojiDraft } from "./LuojiSession";

vi.mock("./LuojiSession", () => ({ useLuojiSession: vi.fn() }));

const draft: LuojiDraft = {
  chartDateTime: "2026-08-12T10:30",
  question: "",
  mode: "coins",
  coinBacks: "",
  originalHexagram: "乾为天",
  changedHexagram: "乾为天",
};

describe("LuojiFormPage coin toss", () => {
  const setDraft = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useLuojiSession).mockReturnValue({
      draft,
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("animates first and records one back count after the toss", () => {
    render(<MemoryRouter><LuojiFormPage /></MemoryRouter>);
    const tossButton = screen.getByRole("button", { name: /点击摇铜钱/ });

    fireEvent.click(tossButton);
    expect(screen.getByRole("button", { name: /铜钱摇动中/ })).toBeDisabled();
    expect(setDraft).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(720));
    expect(setDraft).toHaveBeenCalledTimes(1);
    const updater = setDraft.mock.calls[0]?.[0] as (current: LuojiDraft) => LuojiDraft;
    expect(updater(draft).coinBacks).toMatch(/^[0-3]$/);
  });

  it("shortens the wait when the WebView requests reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true }) as MediaQueryList));
    render(<MemoryRouter><LuojiFormPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /点击摇铜钱/ }));
    act(() => vi.advanceTimersByTime(119));
    expect(setDraft).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(setDraft).toHaveBeenCalledTimes(1);
  });

  it("starts the same sequential toss from a number box", () => {
    render(<MemoryRouter><LuojiFormPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "上爻未填写，点击继续摇盘" }));
    expect(screen.getByRole("button", { name: /铜钱摇动中/ })).toBeDisabled();
    act(() => vi.advanceTimersByTime(720));

    const updater = setDraft.mock.calls[0]?.[0] as (current: LuojiDraft) => LuojiDraft;
    expect(updater(draft).coinBacks).toMatch(/^[0-3]$/);
  });

  it("selects a named hexagram through palace then hexagram", () => {
    vi.mocked(useLuojiSession).mockReturnValue({
      draft: { ...draft, mode: "names" },
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult: vi.fn(),
    });
    render(<MemoryRouter><LuojiFormPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "选择本卦，当前乾为天" }));
    expect(screen.getByRole("dialog", { name: "选择本卦" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /宫/ })).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /兑宫/ }));
    expect(screen.getByLabelText("兑宫八卦").querySelectorAll("button")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /泽水困/ }));

    const updater = setDraft.mock.calls.at(-1)?.[0] as (current: LuojiDraft) => LuojiDraft;
    expect(updater({ ...draft, mode: "names" }).originalHexagram).toBe("泽水困");
  });

  it("uses one numeric input to flow valid digits into six visual boxes", () => {
    vi.mocked(useLuojiSession).mockReturnValue({
      draft: { ...draft, mode: "backs" },
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult: vi.fn(),
    });
    const { rerender } = render(<MemoryRouter><LuojiFormPage /></MemoryRouter>);
    const input = screen.getByLabelText("六次硬币背数");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(document.querySelectorAll(".luoji-code-boxes > span")).toHaveLength(6);

    fireEvent.change(input, { target: { value: "31a20b12" } });
    const updater = setDraft.mock.calls.at(-1)?.[0] as (current: LuojiDraft) => LuojiDraft;
    expect(updater({ ...draft, mode: "backs" }).coinBacks).toBe("312012");

    vi.mocked(useLuojiSession).mockReturnValue({
      draft: { ...draft, mode: "backs", coinBacks: "312012" },
      setDraft,
      chart: null,
      chartRequest: null,
      isRestoring: false,
      setResult: vi.fn(),
    });
    rerender(<MemoryRouter><LuojiFormPage /></MemoryRouter>);
    expect(Array.from(document.querySelectorAll(".luoji-code-boxes b"), (node) => node.textContent).join("")).toBe("312012");
  });
});
