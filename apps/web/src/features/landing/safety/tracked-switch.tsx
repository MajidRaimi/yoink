"use client";

import { cx } from "@/shared/lib/cx";

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
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 rounded-pill border transition-colors dur-2",
        checked ? "border-transparent bg-brand" : "border-muted bg-transparent",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 left-0.5 size-3.5 rounded-pill shadow-1 transition-transform dur-2 ease-out",
          checked ? "translate-x-4 bg-on-brand" : "bg-muted",
        )}
      />
    </span>
    {label}
  </button>
);
