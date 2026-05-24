"use client";

import { useMemo } from "react";
import { minutesToTime } from "@/lib/utils";

function buildTimeOptions(stepMinutes: number): string[] {
  const options: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    options.push(minutesToTime(m));
  }
  return options;
}

type TimeSelect24Props = {
  value: string;
  onChange: (value: string) => void;
  stepMinutes?: number;
  className?: string;
};

export function TimeSelect24({
  value,
  onChange,
  stepMinutes = 15,
  className = "input min-w-0 flex-1 !py-1",
}: TimeSelect24Props) {
  const options = useMemo(() => {
    const base = buildTimeOptions(stepMinutes);
    if (value && !base.includes(value)) {
      return [...base, value].sort();
    }
    return base;
  }, [stepMinutes, value]);

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Saat (24 saat)"
    >
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
