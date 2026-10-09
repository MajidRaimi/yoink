import type { Route } from "next";
import type { DocSection } from "@/shared/contract";
import { COLLECTION_ROUTE_BASES, docHref, routes } from "@/shared/lib/routes";
import { CONTENT_COLLECTIONS, NAV_COLLECTIONS } from "../collections";
import { getDocGroups, getEntries } from "../content";
import { DocsNavGroup } from "./docs-nav-group";
import { DocsNavLink } from "./docs-nav-link";

type NavItem = {
  href: Route;
  label: string;
};

const EXTRA_ITEMS: Readonly<Partial<Record<DocSection, readonly NavItem[]>>> = {
  Reference: [{ href: routes.reference, label: "CLI reference" }],
};

type NavListProps = {
  items: readonly NavItem[];
  labelledBy?: string;
  label?: string;
};

const NavList = ({ items, labelledBy, label }: NavListProps): React.JSX.Element => (
  <ul aria-labelledby={labelledBy} aria-label={label} className="flex flex-col border-l border-hairline">
    {items.map((item) => (
      <li key={item.href}>
        <DocsNavLink href={item.href} label={item.label} />
      </li>
    ))}
  </ul>
);

export const DocsNav = (): React.JSX.Element => (
  <nav aria-label="Documentation pages" className="flex flex-col gap-6">
    {getDocGroups().map((group) => {
      const items: readonly NavItem[] = [
        ...group.docs.map((doc) => ({ href: docHref(doc.slug), label: doc.nav })),
        ...(EXTRA_ITEMS[group.section] ?? []),
      ];
      const labelId = `docs-nav-${group.section.toLowerCase()}`;
      return (
        <div key={group.section} className="flex flex-col gap-2">
          <p id={labelId} className="font-mono text-xs tracking-caps text-faint uppercase">
            {group.section}
          </p>
          <NavList items={items} labelledBy={labelId} />
        </div>
      );
    })}
    {NAV_COLLECTIONS.map((collection) => {
      const entries = getEntries(collection);
      if (entries.length === 0) return null;
      const { label } = CONTENT_COLLECTIONS[collection];
      return (
        <DocsNavGroup key={collection} label={label} routeBase={COLLECTION_ROUTE_BASES[collection]}>
          <NavList label={label} items={entries.map((entry) => ({ href: entry.path as Route, label: entry.nav }))} />
        </DocsNavGroup>
      );
    })}
  </nav>
);
