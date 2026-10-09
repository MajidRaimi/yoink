"use client";

import { useRovingRadio } from "@/features/landing/hooks/use-roving-radio";
import { cn } from "@/shared/lib/cn";

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
      className={cn("inline-flex rounded-pill border border-hairline-strong bg-surface p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          {...itemProps(option.value)}
          className={cn(
            "h-9 rounded-pill px-4 text-sm font-medium text-muted transition-colors dur-1 hover:text-foreground focus-visible:focus-ring",
            option.value === value && "bg-foreground text-background hover:text-background",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
