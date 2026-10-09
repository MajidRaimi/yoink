import { cn } from "@/shared/lib/cn";
import { docHref, type DocSlug } from "@/shared/lib/routes";
import { TextLink } from "@/shared/ui/link";

export type DocLink = {
  label: string;
  slug: DocSlug;
};

export type DocLinksProps = {
  links: readonly DocLink[];
  className?: string;
};

export const DocLinks = ({ links, className }: DocLinksProps): React.JSX.Element => (
  <ul className={cn("flex flex-col gap-2", className)}>
    {links.map((link) => (
      <li key={link.slug}>
        <TextLink href={docHref(link.slug)} className="text-sm">
          {link.label}
        </TextLink>
      </li>
    ))}
  </ul>
);
