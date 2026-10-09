"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/icon";

export type DocsNavGroupProps = {
  label: string;
  routeBase: string;
  children: ReactNode;
};

export const DocsNavGroup = ({ label, routeBase, children }: DocsNavGroupProps): React.JSX.Element => {
  const active = usePathname().startsWith(routeBase);
  return (
    <details open={active} className="group flex flex-col gap-2">
      <summary
        className={cx(
          "flex cursor-pointer list-none items-center justify-between rounded-xs font-mono text-xs tracking-caps uppercase focus-visible:focus-ring [&::-webkit-details-marker]:hidden",
          active ? "text-foreground" : "text-faint hover:text-foreground",
        )}
      >
        {label}
        <Icon icon={CaretDownIcon} size={12} className="transition-transform dur-2 group-open:rotate-180" />
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
};
