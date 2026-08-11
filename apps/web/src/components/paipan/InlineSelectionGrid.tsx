import type { CSSProperties, ReactNode } from "react";

export function InlineSelectionGrid<T>({
  items,
  columns,
  ariaLabel,
  className,
  itemKey,
  isSelected,
  renderButton,
  renderDetail,
}: {
  items: T[];
  columns: number;
  ariaLabel: string;
  className: string;
  itemKey: (item: T) => string | number;
  isSelected: (item: T) => boolean;
  renderButton: (item: T) => ReactNode;
  renderDetail: (item: T) => ReactNode;
}) {
  const rows = Array.from(
    { length: Math.ceil(items.length / columns) },
    (_, index) => items.slice(index * columns, index * columns + columns),
  );

  return (
    <div className={`inline-selection-grid ${className}`} role="group" aria-label={ariaLabel}>
      {rows.map((row) => {
        const selectedColumn = row.findIndex(isSelected);
        const selectedItem = selectedColumn >= 0 ? row[selectedColumn] : undefined;
        const gridStyle = { "--selection-columns": columns } as CSSProperties;
        const pointerPercent = ((selectedColumn + 0.5) / columns) * 100;
        const pointerGapCorrection = selectedColumn * 8
          - ((selectedColumn + 0.5) * (columns - 1) * 8) / columns;
        const detailStyle = selectedItem
          ? { "--pointer-left": `calc(${pointerPercent}% + ${pointerGapCorrection}px)` } as CSSProperties
          : undefined;

        return (
          <div className="selection-grid-row" key={itemKey(row[0]!)}>
            <div className="selection-grid-buttons" style={gridStyle}>
              {row.map(renderButton)}
            </div>
            {selectedItem && (
              <div className="selection-detail selection-bubble" style={detailStyle} aria-live="polite">
                {renderDetail(selectedItem)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
