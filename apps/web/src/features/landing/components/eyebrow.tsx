import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

export const Eyebrow = ({ children, className }: EyebrowProps): React.JSX.Element => (
  <p className={cn("font-mono text-xs font-medium tracking-caps text-brand-text uppercase", className)}>{children}</p>
);
