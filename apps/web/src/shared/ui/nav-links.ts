import { site } from "@/shared/brand/site";
import { routes } from "@/shared/lib/routes";
import type { Href } from "@/shared/ui/href";

export type NavLink = {
  label: string;
  href: Href;
  match: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Docs", href: routes.docs, match: "/docs" },
  { label: "Reference", href: routes.reference, match: "/reference" },
  { label: "Download", href: routes.download, match: "/download" },
  { label: "GitHub", href: site.repo, match: site.repo },
];

export const isActiveNavLink = (link: NavLink, pathname: string): boolean => pathname.startsWith(link.match);
