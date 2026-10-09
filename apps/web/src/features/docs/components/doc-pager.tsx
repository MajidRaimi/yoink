import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { DocMeta } from "@/shared/contract";
import { cn } from "@/shared/lib/cn";
import { docHref } from "@/shared/lib/routes";
import { Icon } from "@/shared/ui/icon";
import type { AdjacentDocs } from "../content";

type PagerLinkProps = {
  doc: DocMeta;
  direction: "previous" | "next";
};

const PagerLink = ({ doc, direction }: PagerLinkProps): React.JSX.Element => {
  const next = direction === "next";
  return (
    <Link
      href={docHref(doc.slug)}
      rel={next ? "next" : "prev"}
      className={cn(
        "group flex min-w-0 flex-1 flex-col gap-1 rounded-md border border-hairline px-4 py-3 transition-colors dur-1 hover:border-hairline-strong hover:bg-surface focus-visible:focus-ring",
        next ? "items-end text-right sm:col-start-2" : "items-start",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted">
        {next ? null : <Icon icon={ArrowLeftIcon} size={12} />}
        {next ? "Next" : "Previous"}
        {next ? <Icon icon={ArrowRightIcon} size={12} /> : null}
      </span>
      <span className="font-medium text-foreground">{doc.title}</span>
    </Link>
  );
};

export type DocPagerProps = {
  adjacent: AdjacentDocs;
};

export const DocPager = ({ adjacent }: DocPagerProps): React.JSX.Element => (
  <nav aria-label="Previous and next pages" className="grid gap-3 sm:grid-cols-2">
    {adjacent.previous === null ? null : <PagerLink doc={adjacent.previous} direction="previous" />}
    {adjacent.next === null ? null : <PagerLink doc={adjacent.next} direction="next" />}
  </nav>
);
