import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type KbdProps = {
  children: ReactNode;
  className?: string;
};

export const Kbd = ({ children, className }: KbdProps): React.JSX.Element => (
  <kbd
    className={cn(
      "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-hairline-strong bg-surface-2 px-1 font-mono text-[0.6875rem] leading-none font-medium text-foreground shadow-1",
      className,
    )}
  >
    {children}
  </kbd>
);
