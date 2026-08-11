import type { ReactNode } from "react";

export function PaipanPageShell({
  children,
  pageClassName = "",
}: {
  children: ReactNode;
  pageClassName?: string;
}) {
  return (
    <main className="app-shell inner-shell min-h-[100dvh]">
      <div className="paper-grain" aria-hidden="true" />
      <div className={`inner-page ${pageClassName}`.trim()}>{children}</div>
    </main>
  );
}
