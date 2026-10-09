"use client";

import { useId } from "react";
import { cn } from "@/shared/lib/cn";
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
      className={cn("relative inline-flex items-center gap-1 rounded-pill border border-hairline bg-surface p-1", className)}
    >
      <legend className="sr-only">Mac processor</legend>
      {MAC_ARCHES.map((option) => (
        <label
          key={option}
          className={cn(
            "cursor-pointer rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors dur-1 has-[:focus-visible]:focus-ring",
            option === arch
              ? "border-brand-text bg-background text-foreground shadow-1"
              : "border-transparent text-muted hover:text-foreground",
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
