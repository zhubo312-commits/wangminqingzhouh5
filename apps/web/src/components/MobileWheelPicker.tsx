import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";
import { createPortal } from "react-dom";

export interface WheelOption {
  value: string;
  label: string;
}

export interface WheelColumn {
  id: string;
  label: string;
  value: string;
  options: WheelOption[];
  onChange: (value: string) => void;
}

interface MobileWheelPickerProps {
  open: boolean;
  title: string;
  columns: WheelColumn[];
  onCancel: () => void;
  onConfirm: () => void;
  extraContent?: ReactNode;
}

const ITEM_HEIGHT = 52;

function WheelColumnView({ column, open }: { column: WheelColumn; open: boolean }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const selectedIndex = Math.max(
    0,
    column.options.findIndex((option) => option.value === column.value),
  );
  const optionValues = column.options.map((option) => option.value).join("\u0000");

  useEffect(() => {
    if (!open || !viewportRef.current) return;
    viewportRef.current.scrollTo({ top: selectedIndex * ITEM_HEIGHT });
  }, [column.id, open, optionValues]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    },
    [],
  );

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const scrollTop = event.currentTarget.scrollTop;
    const viewport = event.currentTarget;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(() => {
      const nextIndex = Math.max(
        0,
        Math.min(column.options.length - 1, Math.round(scrollTop / ITEM_HEIGHT)),
      );
      const nextValue = column.options[nextIndex]?.value;
      if (nextValue !== undefined && nextValue !== column.value) {
        column.onChange(nextValue);
      }
    });
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = window.setTimeout(() => {
      const nextIndex = Math.max(
        0,
        Math.min(column.options.length - 1, Math.round(viewport.scrollTop / ITEM_HEIGHT)),
      );
      viewport.scrollTo({ top: nextIndex * ITEM_HEIGHT });
    }, 90);
  }

  return (
    <div className="wheel-column">
      <span className="wheel-column-label">{column.label}</span>
      <div className="wheel-selection-band" aria-hidden="true" />
      <div
        className="wheel-viewport"
        ref={viewportRef}
        role="listbox"
        aria-label={`${column.label}滚轮`}
        tabIndex={0}
        onScroll={onScroll}
      >
        <div className="wheel-list">
          {column.options.map((option) => {
            const selected = option.value === column.value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={selected ? "selected" : ""}
                key={option.value}
                onClick={() => {
                  const nextIndex = column.options.findIndex((item) => item.value === option.value);
                  viewportRef.current?.scrollTo({ top: nextIndex * ITEM_HEIGHT });
                  column.onChange(option.value);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MobileWheelPicker({
  open,
  title,
  columns,
  onCancel,
  onConfirm,
  extraContent,
}: MobileWheelPickerProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => confirmRef.current?.focus(), 80);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") cancelRef.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  function renderColumns(items: WheelColumn[]) {
    const columnsStyle = {
      "--wheel-column-count": items.length,
    } as CSSProperties;

    return (
      <div className="wheel-columns" style={columnsStyle}>
        {items.map((column) => (
          <WheelColumnView column={column} open={open} key={column.id} />
        ))}
      </div>
    );
  }

  return createPortal(
    <div className="wheel-picker-backdrop" onMouseDown={onCancel}>
      <section
        className="wheel-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="wheel-picker-handle" aria-hidden="true" />
        <header className="wheel-picker-toolbar">
          <button type="button" className="wheel-picker-cancel" onClick={onCancel}>
            取消
          </button>
          <h2>{title}</h2>
          <button
            type="button"
            className="wheel-picker-confirm"
            ref={confirmRef}
            onClick={onConfirm}
          >
            确定
          </button>
        </header>
        {renderColumns(columns)}
        {extraContent && <div className="wheel-picker-extra">{extraContent}</div>}
      </section>
    </div>,
    document.body,
  );
}
