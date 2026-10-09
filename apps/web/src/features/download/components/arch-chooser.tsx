"use client";

import { useId } from "react";
import { cx } from "@/shared/lib/cx";
import { useMacArch } from "@/features/download/hooks/use-mac-arch";
import { MAC_ARCHES, MAC_ARCH_LABELS } from "@/features/download/lib/mac-arch";

export type ArchChooserProps = {
  className?: string;
};

export const ArchChooser = ({ className }: ArchChooserProps): React.JSX.Element => {
  const { arch, choose } = useMacArch();
  const name = useId();

  return (
    <fieldset
      className={cx("inline-flex items-center rounded-pill border border-hairline-strong bg-surface p-1", className)}
    >
      <legend className="sr-only">Mac processor</legend>
      {MAC_ARCHES.map((option) => (
        <label
          key={option}
          className={cx(
            "flex h-8 cursor-pointer items-center whitespace-nowrap rounded-pill px-3 text-xs font-medium transition-colors dur-1 has-[:focus-visible]:focus-ring",
            option === arch ? "bg-foreground text-background" : "text-muted hover:text-foreground",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={option === arch}
            onChange={() => choose(option)}
            className="sr-only"
          />
          {MAC_ARCH_LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
};
