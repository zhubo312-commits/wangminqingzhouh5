import { CaretRight, ChatCircleDots } from "@phosphor-icons/react";
import { trackEvent } from "../lib/api-client";

export function InterpretationEntry({ href, placement }: {
  href: string | null;
  placement: "top" | "bottom";
}) {
  const isTop = placement === "top";
  const content = (
    <>
      <span className="interpretation-entry-icon" aria-hidden="true">
        <ChatCircleDots size={isTop ? 24 : 26} weight="duotone" />
      </span>
      <span className="interpretation-entry-copy">
        <strong>{isTop ? "老师解读" : "请老师解读本盘"}</strong>
        <small>{isTop ? "智能老师为您详解本盘" : "AI 智能解读 · 仅供参考"}</small>
      </span>
      {isTop && <CaretRight className="interpretation-entry-arrow" size={20} weight="bold" aria-hidden="true" />}
    </>
  );
  const className = `interpretation-entry interpretation-entry-${placement}${href ? "" : " interpretation-entry-disabled"}`;

  if (!href) return <div className={className} aria-disabled="true">{content}</div>;

  return (
    <a
      className={className}
      href={href}
      target="_self"
      aria-label={isTop ? "老师解读：智能老师为您详解本盘" : "请老师解读本盘：AI 智能解读，仅供参考"}
      onClick={() => void trackEvent("interpretation_click").catch(() => undefined)}
    >
      {content}
    </a>
  );
}
