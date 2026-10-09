"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { TextLink } from "@/shared/ui/link";
import { isActiveNavLink, type NavLink } from "@/shared/ui/nav-links";

export type NavLinkItemProps = {
  link: NavLink;
  className?: string;
  onNavigate?: () => void;
};

export const NavLinkItem = ({ link, className, onNavigate }: NavLinkItemProps): React.JSX.Element => {
  const pathname = usePathname();
  const active = isActiveNavLink(link, pathname);
  return (
    <TextLink
      href={link.href}
      tone="muted"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn("px-3 py-2 text-sm font-medium", active && "text-foreground", className)}
    >
      {link.label}
    </TextLink>
  );
};
