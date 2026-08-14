import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

type CompositionSafeNameInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "maxLength" | "onChange" | "value"> & {
  maxCharacters: number;
  onValueChange: (value: string) => void;
  value: string;
};

function normalizeValue(value: string, maxCharacters: number) {
  return [...value.replace(/\s+/gu, "")].slice(0, maxCharacters).join("");
}

export function CompositionSafeNameInput({ maxCharacters, onValueChange, value, ...inputProps }: CompositionSafeNameInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const composing = useRef(false);

  useEffect(() => {
    if (!composing.current) setDisplayValue(value);
  }, [value]);

  function commit(nextValue: string) {
    const normalized = normalizeValue(nextValue, maxCharacters);
    setDisplayValue(normalized);
    onValueChange(normalized);
  }

  return <input
    {...inputProps}
    value={displayValue}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={(event) => { composing.current = false; commit(event.currentTarget.value); }}
    onChange={(event) => {
      const nextValue = event.currentTarget.value;
      if (composing.current || (event.nativeEvent as InputEvent).isComposing) setDisplayValue(nextValue);
      else commit(nextValue);
    }}
  />;
}
