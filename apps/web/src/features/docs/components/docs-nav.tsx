import type { Route } from "next";
import type { DocSection } from "@/shared/contract";
import { docHref, routes } from "@/shared/lib/routes";
import { getDocGroups } from "../content";
import { DocsNavLink } from "./docs-nav-link";

type NavItem = {
  href: Route;
  label: string;
};

const EXTRA_ITEMS: Readonly<Partial<Record<DocSection, readonly NavItem[]>>> = {
  Reference: [{ href: routes.reference, label: "CLI reference" }],
};

export const DocsNav = (): React.JSX.Element => (
  <nav aria-label="Documentation pages" className="flex flex-col gap-6">
    {getDocGroups().map((group) => {
      const items: readonly NavItem[] = [
        ...group.docs.map((doc) => ({ href: docHref(doc.slug), label: doc.nav })),
        ...(EXTRA_ITEMS[group.section] ?? []),
      ];
      return (
        <div key={group.section} className="flex flex-col gap-2">
          <h2 className="font-mono text-xs tracking-caps text-faint uppercase">{group.section}</h2>
          <ul className="flex flex-col border-l border-hairline">
            {items.map((item) => (
              <li key={item.href}>
                <DocsNavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </div>
      );
    })}
  </nav>
);
