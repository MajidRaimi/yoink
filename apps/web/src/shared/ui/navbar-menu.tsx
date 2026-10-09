"use client";

import { ListIcon, XIcon } from "@phosphor-icons/react";
import { useId, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { useDisclosure } from "@/shared/lib/use-disclosure";
import { Icon } from "@/shared/ui/icon";
import { NavLinkItem } from "@/shared/ui/nav-link-item";
import { NAV_LINKS } from "@/shared/ui/nav-links";

export type NavbarMenuProps = {
  cta?: ReactNode;
};

export const NavbarMenu = ({ cta }: NavbarMenuProps): React.JSX.Element => {
  const { open, toggle, hide } = useDisclosure();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Escape" || !open) return;
    hide();
    buttonRef.current?.focus();
  };
  const closeOnFocusLeave = (event: FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    hide();
  };

  return (
    <div className="md:hidden" onKeyDown={closeOnEscape} onBlur={closeOnFocusLeave}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-10 place-items-center rounded-button text-foreground transition-colors dur-1 hover:bg-surface-2 focus-visible:focus-ring"
      >
        <Icon icon={open ? XIcon : ListIcon} size={20} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-hairline bg-background px-4 pt-2 pb-4 shadow-2"
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <NavLinkItem key={link.label} link={link} onNavigate={hide} size="menu" />
          ))}
        </nav>
        {cta === undefined ? null : (
          <div className="mt-3 flex" onClick={hide}>
            {cta}
          </div>
        )}
      </div>
    </div>
  );
};
