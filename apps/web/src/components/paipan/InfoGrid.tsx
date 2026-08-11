import type { ReactNode } from "react";

export function InfoGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={`facts-grid ${className}`.trim()}>{children}</dl>;
}

export function InfoPair({ label, value }: { label: string; value: ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return <div className="info-pair"><dt>{label}</dt><dd>{empty ? "—" : value}</dd></div>;
}
