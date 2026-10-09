"use client";

import { cn } from "@/shared/lib/cn";

export type TrackedSwitchProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export const TrackedSwitch = ({ checked, onToggle, label }: TrackedSwitchProps): React.JSX.Element => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onToggle}
    className="inline-flex items-center gap-3 rounded-sm py-1 text-sm text-foreground focus-visible:focus-ring"
  >
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-pill border border-hairline-strong bg-surface-3 transition-colors dur-2",
        checked && "border-transparent bg-brand",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-3.5 rounded-pill bg-background shadow-1 transition-transform dur-2 ease-out",
          checked && "translate-x-4 bg-on-brand",
        )}
      />
    </span>
    {label}
  </button>
);
