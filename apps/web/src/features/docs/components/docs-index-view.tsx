import type { Route } from "next";
import Link from "next/link";
import { docHref, routes } from "@/shared/lib/routes";
import { getDocGroups } from "../content";

type IndexItem = {
  href: Route;
  label: string;
  description: string;
};

const REFERENCE_ITEM: IndexItem = {
  href: routes.reference,
  label: "CLI reference",
  description: "Every command, alias, and flag with an example, plus the menu keymap.",
};

export const DocsIndexView = (): React.JSX.Element => (
  <div className="flex max-w-[72ch] flex-col gap-12">
    <header className="flex flex-col gap-4">
      <h1 className="display text-4xl">Docs</h1>
      <p className="text-lg text-muted">
        Switch accounts, connect providers, and see exactly what yoink writes. These pages are rendered from the Markdown in
        the repo&apos;s <code className="font-mono text-[0.9em]">docs/</code> folder.
      </p>
    </header>
    <div className="flex flex-col">
      {getDocGroups().map((group) => {
        const items: readonly IndexItem[] = [
          ...group.docs.map((doc) => ({ href: docHref(doc.slug), label: doc.title, description: doc.description })),
          ...(group.section === "Reference" ? [REFERENCE_ITEM] : []),
        ];
        return (
          <section
            key={group.section}
            aria-labelledby={`docs-group-${group.section}`}
            className="grid gap-4 border-t border-hairline py-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8"
          >
            <h2 id={`docs-group-${group.section}`} className="font-mono text-xs tracking-caps text-faint uppercase sm:pt-1">
              {group.section}
            </h2>
            <ul className="flex flex-col gap-6">
              {items.map((item) => (
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
        );
      })}
    </div>
  </div>
);
