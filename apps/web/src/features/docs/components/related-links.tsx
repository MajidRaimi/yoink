import Link from "next/link";
import type { Route } from "next";
import type { EntryMeta } from "../entry-types";

export type RelatedLinksProps = {
  entries: readonly EntryMeta[];
};

export const RelatedLinks = ({ entries }: RelatedLinksProps): React.JSX.Element | null => {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="related-pages" className="flex flex-col gap-4 border-t border-hairline pt-6">
      <h2 id="related-pages" className="font-mono text-xs tracking-caps text-faint uppercase">
        Related
      </h2>
      <ul className="flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.path} className="flex flex-col gap-1">
            <Link
              href={entry.path as Route}
              className="w-fit rounded-xs font-medium text-foreground underline decoration-hairline-strong decoration-2 underline-offset-4 transition-colors dur-1 hover:decoration-brand focus-visible:focus-ring"
            >
              {entry.title}
            </Link>
            <p className="text-sm text-muted">{entry.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
