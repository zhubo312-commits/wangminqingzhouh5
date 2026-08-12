import { CaretDown } from "@phosphor-icons/react";
import { useCallback, useId, useState } from "react";
import {
  MobileWheelPicker,
  type WheelColumn,
  type WheelOption,
} from "./MobileWheelPicker";

interface WheelSelectPickerProps {
  label: string;
  title?: string;
  value: string;
  options: WheelOption[];
  onChange: (value: string) => void;
}

export function WheelSelectPicker({
  label,
  title = `选择${label}`,
  value,
  options,
  onChange,
}: WheelSelectPickerProps) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(value);
  const labelId = useId();
  const close = useCallback(() => setOpen(false), []);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  function openPicker() {
    setWorking(value);
    setOpen(true);
  }

  const columns: WheelColumn[] = [
    {
      id: labelId,
      label,
      value: working,
      options,
      onChange: setWorking,
    },
  ];

  return (
    <div className="wheel-select-field">
      <span className="wheel-select-label" id={labelId}>{label}</span>
      <button
        type="button"
        className="wheel-picker-trigger wheel-picker-trigger-single"
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPicker}
      >
        <span className="wheel-picker-trigger-copy"><strong>{selectedLabel}</strong></span>
        <CaretDown size={20} weight="bold" aria-hidden="true" />
      </button>
      <MobileWheelPicker
        open={open}
        title={title}
        columns={columns}
        onCancel={close}
        onConfirm={() => {
          onChange(working);
          close();
        }}
      />
    </div>
  );
}
