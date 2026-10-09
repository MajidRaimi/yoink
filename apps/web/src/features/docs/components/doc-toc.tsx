"use client";

import type { DocHeading } from "@/shared/contract";
import { cn } from "@/shared/lib/cn";
import { useActiveHeading } from "../hooks/use-active-heading";

export type DocTocProps = {
  headings: readonly DocHeading[];
};

export const DocToc = ({ headings }: DocTocProps): React.JSX.Element => {
  const active = useActiveHeading(headings.map((heading) => heading.id));
  return (
    <nav aria-label="On this page" className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-caps text-faint uppercase">On this page</p>
      <ul className="flex flex-col border-l border-hairline">
        {headings.map((heading) => {
          const current = heading.id === active;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1 text-sm leading-snug transition-colors dur-1 focus-visible:focus-ring",
                  heading.depth === 3 ? "pl-6" : "pl-3",
                  current ? "border-brand-text text-foreground" : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
