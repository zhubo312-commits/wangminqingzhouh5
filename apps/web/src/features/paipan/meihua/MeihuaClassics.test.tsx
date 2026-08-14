import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MeihuaClassicBrowser } from "./MeihuaClassics";

describe("MeihuaClassicBrowser", () => {
  afterEach(cleanup);

  it("groups the sixty-four hexagrams into one-at-a-time eight-palace accordions", () => {
    render(<MeihuaClassicBrowser />);

    expect(screen.getAllByRole("button", { name: /宫/ })).toHaveLength(8);
    const palaceNames = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
    const visibleClassics = new Set<string>();
    for (const palaceName of palaceNames) {
      const trigger = screen.getByRole("button", { name: new RegExp(`${palaceName}宫`) });
      fireEvent.click(trigger);
      const region = screen.getByRole("region", { name: new RegExp(`${palaceName}宫`) });
      const entries = within(region).getAllByRole("button");
      expect(entries).toHaveLength(8);
      entries.forEach((entry) => visibleClassics.add(entry.getAttribute("aria-label") ?? ""));
    }
    expect(visibleClassics).toHaveLength(64);

    const qian = screen.getByRole("button", { name: /乾宫/ });
    const dui = screen.getByRole("button", { name: /兑宫/ });
    expect(qian).toHaveTextContent("☰");
    expect(qian).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(qian);
    expect(qian).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: /乾宫/ })).toBeVisible();
    expect(within(screen.getByRole("region", { name: /乾宫/ })).getAllByRole("button")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "查看第1卦 乾为天" })).toHaveTextContent("䷀");

    fireEvent.click(dui);
    expect(qian).toHaveAttribute("aria-expanded", "false");
    expect(dui).toHaveAttribute("aria-expanded", "true");
  });

  it("searches across all palaces and opens the classic details", () => {
    render(<MeihuaClassicBrowser />);

    fireEvent.change(screen.getByLabelText("搜索六十四卦"), { target: { value: "未济" } });
    expect(screen.getByText("跨八宫搜索")).toBeVisible();
    expect(screen.getByText("1 卦")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "查看第64卦 火水未济" }));
    expect(screen.getByRole("dialog", { name: "火水未济" })).toBeVisible();
  });
});
