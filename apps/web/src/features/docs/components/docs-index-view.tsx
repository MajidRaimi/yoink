import type { Route } from "next";
import Link from "next/link";
import { docHref, routes } from "@/shared/lib/routes";
import { CONTENT_COLLECTIONS, NAV_COLLECTIONS, type ContentCollectionId } from "../collections";
import { getDocGroups, getEntries } from "../content";

export const DOCS_INDEX_TITLE = "Yoink documentation";

type IndexItem = {
  href: Route;
  label: string;
  description: string;
};

const REFERENCE_ITEM: IndexItem = {
  href: routes.reference,
  label: "CLI reference",
  description: "One card per command with its flags, aliases and an example, plus the menu keymap and the tool, harness and preset ids.",
};

type IndexGroup = {
  key: string;
  title: string;
  anchor?: ContentCollectionId;
  items: readonly IndexItem[];
};

const docGroups = (): readonly IndexGroup[] =>
  getDocGroups().map((group) => ({
    key: group.section,
    title: group.section,
    items: [
      ...group.docs.map((doc) => ({ href: docHref(doc.slug), label: doc.title, description: doc.description })),
      ...(group.section === "Reference" ? [REFERENCE_ITEM] : []),
    ],
  }));

const collectionGroups = (): readonly IndexGroup[] =>
  NAV_COLLECTIONS.flatMap((collection) => {
    const entries = getEntries(collection);
    if (entries.length === 0) return [];
    return [
      {
        key: collection,
        title: CONTENT_COLLECTIONS[collection].label,
        anchor: collection,
        items: entries.map((entry) => ({ href: entry.path as Route, label: entry.title, description: entry.description })),
      },
    ];
  });

export const DocsIndexView = (): React.JSX.Element => (
  <div className="flex max-w-[72ch] flex-col gap-12">
    <header className="flex flex-col gap-4">
      <h1 className="display text-4xl">{DOCS_INDEX_TITLE}</h1>
      <p className="text-lg text-muted">
        Switch accounts, connect providers and see exactly what yoink writes. Guides are rendered from the Markdown in
        the repo&apos;s <code className="font-mono text-[0.9em]">docs/</code> folder.
      </p>
    </header>
    <div className="flex flex-col">
      {[...docGroups(), ...collectionGroups()].map((group) => (
        <section
          key={group.key}
          id={group.anchor}
          aria-labelledby={`docs-group-${group.key}`}
          className="grid scroll-mt-24 gap-4 border-t border-hairline py-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8"
        >
          <h2 id={`docs-group-${group.key}`} className="font-mono text-xs tracking-caps text-faint uppercase sm:pt-1">
            {group.title}
          </h2>
          <ul className="flex flex-col gap-6">
            {group.items.map((item) => (
              <li key={item.href} className="flex flex-col gap-1">
                <Link
                  href={item.href}
                  className="w-fit rounded-xs text-lg font-medium text-foreground underline decoration-hairline-strong decoration-2 underline-offset-4 transition-colors dur-1 hover:decoration-brand focus-visible:focus-ring"
                >
                  {item.label}
                </Link>
                <p className="text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </div>
);
