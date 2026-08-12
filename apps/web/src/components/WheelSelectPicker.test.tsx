import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { WheelSelectPicker } from "./WheelSelectPicker";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(cleanup);

describe("WheelSelectPicker", () => {
  it("commits a wheel selection only after confirmation", () => {
    const onChange = vi.fn();
    render(
      <WheelSelectPicker
        label="上卦"
        value="1"
        options={[
          { value: "1", label: "1 · 乾" },
          { value: "8", label: "8 · 坤" },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "上卦" }));
    expect(screen.getByRole("dialog", { name: "选择上卦" })).toBeVisible();
    fireEvent.click(screen.getByRole("option", { name: "8 · 坤" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledWith("8");
  });
});
