import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompositionSafeNameInput } from "./CompositionSafeNameInput";

afterEach(cleanup);

describe("CompositionSafeNameInput", () => {
  it("keeps the complete pinyin buffer until Chinese IME composition ends", () => {
    const onValueChange = vi.fn();
    render(<label>姓名<CompositionSafeNameInput value="" maxCharacters={5} onValueChange={onValueChange} /></label>);
    const input = screen.getByRole("textbox", { name: "姓名" });

    expect(input).not.toHaveAttribute("maxlength");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "liming" } });
    expect(input).toHaveValue("liming");
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "李明" } });
    fireEvent.compositionEnd(input);
    expect(input).toHaveValue("李明");
    expect(onValueChange).toHaveBeenLastCalledWith("李明");
  });

  it("applies the logical Chinese character limit after normal input", () => {
    const onValueChange = vi.fn();
    render(<label>姓名<CompositionSafeNameInput value="" maxCharacters={5} onValueChange={onValueChange} /></label>);
    const input = screen.getByRole("textbox", { name: "姓名" });
    fireEvent.change(input, { target: { value: "欧阳一二三四" } });
    expect(input).toHaveValue("欧阳一二三");
    expect(onValueChange).toHaveBeenLastCalledWith("欧阳一二三");
  });
});
