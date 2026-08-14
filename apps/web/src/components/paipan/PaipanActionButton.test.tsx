import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaipanActionButton } from "./PaipanActionButton";

afterEach(cleanup);

describe("PaipanActionButton", () => {
  it.each(["zoom", "restart", "retry", "edit"] as const)("marks the %s semantic variant", (variant) => {
    render(<PaipanActionButton variant={variant}>{variant}</PaipanActionButton>);
    const button = screen.getByRole("button", { name: variant });
    expect(button).toHaveAttribute("data-paipan-action", variant);
    expect(button).toHaveClass(`paipan-action-button--${variant}`);
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("places navigation icons according to direction", () => {
    const { rerender } = render(<PaipanActionButton variant="navigate" direction="previous">上一局</PaipanActionButton>);
    let button = screen.getByRole("button", { name: "上一局" });
    expect(button).toHaveAttribute("data-direction", "previous");
    expect(button.firstElementChild?.tagName).toBe("svg");

    rerender(<PaipanActionButton variant="navigate" direction="next">下一局</PaipanActionButton>);
    button = screen.getByRole("button", { name: "下一局" });
    expect(button).toHaveAttribute("data-direction", "next");
    expect(button.lastElementChild?.tagName).toBe("svg");
  });

  it("exposes busy and icon-only states without firing", () => {
    const onClick = vi.fn();
    render(<PaipanActionButton variant="retry" busy iconOnly aria-label="重新加载流月" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "重新加载流月" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("paipan-action-button--icon-only");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
