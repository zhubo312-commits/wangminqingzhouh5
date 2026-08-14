import {
  ArrowClockwise,
  ArrowsOut,
  CaretLeft,
  CaretRight,
  PencilSimple,
} from "@phosphor-icons/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ReactNode;
  busy?: boolean;
  iconOnly?: boolean;
};

type PaipanActionButtonProps = CommonProps & (
  | { variant: "zoom" | "restart" | "retry" | "edit"; direction?: never }
  | { variant: "navigate"; direction: "previous" | "next" }
);

export function PaipanActionButton({
  variant,
  direction,
  busy = false,
  iconOnly = false,
  className = "",
  disabled,
  children,
  ...buttonProps
}: PaipanActionButtonProps) {
  const iconSize = variant === "retry" ? 17 : 19;
  const leadingIcon = variant === "zoom"
    ? <ArrowsOut size={iconSize} weight="bold" aria-hidden="true" />
    : variant === "edit"
      ? <PencilSimple size={iconSize} weight="bold" aria-hidden="true" />
    : variant === "navigate" && direction === "previous"
      ? <CaretLeft size={iconSize} weight="bold" aria-hidden="true" />
      : variant === "restart" || variant === "retry"
        ? <ArrowClockwise size={iconSize} weight="bold" aria-hidden="true" />
        : null;
  const trailingIcon = variant === "navigate" && direction === "next"
    ? <CaretRight size={iconSize} weight="bold" aria-hidden="true" />
    : null;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      className={`paipan-action-button paipan-action-button--${variant}${iconOnly ? " paipan-action-button--icon-only" : ""}${className ? ` ${className}` : ""}`}
      data-paipan-action={variant}
      data-direction={direction}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
