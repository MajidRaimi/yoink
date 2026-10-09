import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";

export type KbdSize = "sm" | "md";

export type KbdProps = {
  children: ReactNode;
  size?: KbdSize;
  className?: string;
};

const sizes: Readonly<Record<KbdSize, string>> = {
  sm: "h-5 min-w-5 px-1 text-[0.6875rem] leading-none",
  md: "h-6 min-w-6 px-1.5 text-xs",
};

export const Kbd = ({ children, size = "sm", className }: KbdProps): React.JSX.Element => (
  <kbd
    className={cx(
      "inline-flex items-center justify-center rounded-xs border border-hairline-strong bg-surface-2 font-mono font-medium text-foreground shadow-1",
      sizes[size],
      className,
    )}
  >
    {children}
  </kbd>
);
