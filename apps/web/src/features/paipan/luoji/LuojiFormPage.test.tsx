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
});
