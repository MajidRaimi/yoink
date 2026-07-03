import type { ReactNode } from "react";

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-hairline bg-surface px-1 font-mono text-[10px] leading-4 text-faint">
    {children}
  </kbd>
);
