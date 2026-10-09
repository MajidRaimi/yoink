import { cn } from "@/shared/lib/cn";
import type { Route } from "next";
import { TextLink } from "@/shared/ui/link";

export type DocLink = {
  label: string;
  href: Route;
};

export type DocLinksProps = {
  links: readonly DocLink[];
  className?: string;
};

export const DocLinks = ({ links, className }: DocLinksProps): React.JSX.Element => (
  <ul className={cn("flex flex-col gap-2", className)}>
    {links.map((link) => (
      <li key={link.href}>
        <TextLink href={link.href} className="text-sm">
          {link.label}
        </TextLink>
      </li>
    ))}
  </ul>
);
