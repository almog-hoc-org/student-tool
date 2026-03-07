import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number | string;
  onChange: (e: { target: { value: string } }) => void;
  placeholder?: string;
  className?: string;
}

function formatWithCommas(num: string): string {
  if (!num) return "";
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function stripNonNumeric(str: string): string {
  return str.replace(/[^0-9.]/g, "");
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  const rawValue = String(value ?? "");

  const displayValue = rawValue
    ? focused
      ? formatWithCommas(rawValue)
      : `₪${formatWithCommas(rawValue)}`
    : "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripNonNumeric(e.target.value);
      onChange({ target: { value: raw } });
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
