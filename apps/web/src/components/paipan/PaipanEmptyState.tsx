import type { ReactNode } from "react";

export function PaipanEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="session-empty" role="status">
      {icon}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}
