import type { ReactNode } from "react";

export function PaipanSectionCard({
  children,
  className = "",
  labelledBy,
  label,
  variant = "result",
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  label?: string;
  variant?: "form" | "result";
}) {
  return (
    <section
      className={`${variant}-card ${className}`.trim()}
      aria-labelledby={labelledBy}
      aria-label={label}
    >
      {children}
    </section>
  );
}
