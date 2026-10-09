import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";

export type InlineCodeProps = {
  children: ReactNode;
  className?: string;
};

export const InlineCode = ({ children, className }: InlineCodeProps): React.JSX.Element => (
  <code
    className={cx(
      "rounded-xs border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em] tracking-mono break-words box-decoration-clone",
      className,
    )}
  >
    {children}
  </code>
);
