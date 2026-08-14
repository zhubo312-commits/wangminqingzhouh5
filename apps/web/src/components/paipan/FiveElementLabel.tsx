import { Coins, Drop, Flame, Mountains, Tree } from "@phosphor-icons/react";

export const ELEMENT_CLASS: Record<string, string> = {
  木: "element-wood",
  火: "element-fire",
  土: "element-earth",
  金: "element-metal",
  水: "element-water",
};

export function FiveElementLabel({ element, iconSize = 14, className = "" }: { element: string; iconSize?: number; className?: string }) {
  const iconProps = { size: iconSize, weight: "duotone" as const, "aria-hidden": true };
  const icon = element === "金"
    ? <Coins {...iconProps} />
    : element === "木"
      ? <Tree {...iconProps} />
      : element === "水"
        ? <Drop {...iconProps} />
        : element === "火"
          ? <Flame {...iconProps} />
          : element === "土"
            ? <Mountains {...iconProps} />
            : null;

  return <span className={`five-element-label ${ELEMENT_CLASS[element] ?? ""} ${className}`.trim()} aria-label={`五行 ${element}`}>{icon}<span>{element}</span></span>;
}
