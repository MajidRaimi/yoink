import type { ReactElement } from "react";
import { cn } from "./cn";

type SegmentedOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type SegmentedProps<TValue extends string> = {
  options: readonly SegmentedOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export const Segmented = <TValue extends string>({ options, value, onChange }: SegmentedProps<TValue>): ReactElement => (
  <div role="tablist" className="flex rounded-full border border-hairline bg-surface p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="tab"
        tabIndex={-1}
        aria-selected={option.value === value}
        onClick={() => onChange(option.value)}
        className={cn(
          "flex-1 rounded-full px-3 py-1 font-mono text-[11px] transition-colors",
          option.value === value ? "bg-surface-3 text-foreground" : "text-faint hover:text-foreground",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);
