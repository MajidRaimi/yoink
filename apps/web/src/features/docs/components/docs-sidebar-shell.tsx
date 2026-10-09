"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { useDisclosure } from "@/shared/lib/use-disclosure";
import { Icon } from "@/shared/ui/icon";

export type DocsSidebarShellProps = {
  search: ReactNode;
  children: ReactNode;
};

export const DocsSidebarShell = ({ search, children }: DocsSidebarShellProps): React.JSX.Element => {
  const { open, toggle, hide } = useDisclosure();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Escape" || !open) return;
    hide();
    buttonRef.current?.focus();
  };
  const closeOnLink = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target instanceof Element && event.target.closest("a") !== null) hide();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{search}</div>
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-button border border-hairline-strong px-3.5 text-sm font-medium text-foreground transition-colors dur-1 hover:bg-surface-2 focus-visible:focus-ring lg:hidden"
        >
          Pages
          <Icon icon={CaretDownIcon} size={14} className={cx("transition-transform dur-2", open && "rotate-180")} />
        </button>
      </div>
      <div
        id={panelId}
        onClick={closeOnLink}
        onKeyDown={closeOnEscape}
        className={cx("border-b border-hairline pb-6 lg:block lg:border-b-0 lg:pb-0", open ? "block" : "hidden")}
      >
        {children}
      </div>
    </div>
  );
};
