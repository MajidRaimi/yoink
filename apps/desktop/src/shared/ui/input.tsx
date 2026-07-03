import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";
import { ChevronDownIcon } from "./icons";

export const Input = ({ className, ...props }: ComponentPropsWithRef<"input">) => (
  <input
    className={cn(
      "w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 font-mono text-[13px] text-foreground transition-colors placeholder:text-faint focus:border-brand",
      className,
    )}
    {...props}
  />
);

export const Select = ({ className, ...props }: ComponentPropsWithRef<"select">) => (
  <div className="relative">
    <select
      className={cn(
        "w-full appearance-none rounded-lg border border-hairline-strong bg-surface px-3 py-2 pr-8 font-mono text-[13px] text-foreground transition-colors focus:border-brand",
        className,
      )}
      {...props}
    />
    <ChevronDownIcon size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
  </div>
);
