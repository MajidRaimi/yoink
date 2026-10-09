"use client";

import { usePathname } from "next/navigation";
import { cx } from "@/shared/lib/cx";
import { TextLink } from "@/shared/ui/link";
import { isActiveNavLink, type NavLink } from "@/shared/ui/nav-links";

export type NavLinkItemSize = "bar" | "menu";

export type NavLinkItemProps = {
  link: NavLink;
  size?: NavLinkItemSize;
  onNavigate?: () => void;
};

const sizes: Readonly<Record<NavLinkItemSize, string>> = {
  bar: "py-2 text-sm",
  menu: "py-3 text-base",
};

export const NavLinkItem = ({ link, size = "bar", onNavigate }: NavLinkItemProps): React.JSX.Element => {
  const pathname = usePathname();
  const active = isActiveNavLink(link, pathname);
  return (
    <TextLink
      href={link.href}
      tone="muted"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cx("px-3 font-medium aria-[current=page]:text-foreground", sizes[size])}
    >
      {link.label}
    </TextLink>
  );
};
