import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import type { DocHeading } from "@/shared/contract";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";

export type DocTocCollapsibleProps = {
  headings: readonly DocHeading[];
  className?: string;
};

export const DocTocCollapsible = ({ headings, className }: DocTocCollapsibleProps): React.JSX.Element => (
  <details className={cn("group rounded-md border border-hairline bg-surface", className)}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md px-4 py-3 text-sm font-medium focus-visible:focus-ring [&::-webkit-details-marker]:hidden">
      On this page
      <Icon icon={CaretDownIcon} size={14} className="text-muted transition-transform dur-2 group-open:rotate-180" />
    </summary>
    <nav aria-label="On this page" className="border-t border-hairline px-4 py-3">
      <ul className="flex flex-col gap-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block rounded-xs py-1 text-sm text-muted hover:text-foreground focus-visible:focus-ring",
                heading.depth === 3 && "pl-4",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </details>
);
