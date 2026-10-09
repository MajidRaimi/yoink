"use client";

import { useRovingRadio } from "@/features/landing/hooks/use-roving-radio";
import { cx } from "@/shared/lib/cx";

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
};

export type SegmentedControlProps<Value extends string> = {
  label: string;
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onChange: (next: Value) => void;
  className?: string;
};

export const SegmentedControl = <Value extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<Value>): React.JSX.Element => {
  const { itemProps } = useRovingRadio(
    options.map((option) => option.value),
    value,
    onChange,
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("inline-flex rounded-pill border border-hairline-strong bg-surface p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          {...itemProps(option.value)}
          className={cx(
            "h-9 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-colors dur-1 focus-visible:focus-ring",
            option.value === value ? "bg-foreground text-background" : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
