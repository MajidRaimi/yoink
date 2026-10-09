import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { isExternalHref, type Href } from "@/shared/ui/href";

export type TextLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href;
  tone?: "accent" | "muted" | "on-brand";
  children: ReactNode;
};

const tones: Readonly<Record<NonNullable<TextLinkProps["tone"]>, string>> = {
  accent:
    "text-foreground underline decoration-brand decoration-2 underline-offset-4 hover:text-brand-text",
  muted: "text-muted hover:text-foreground",
  "on-brand": "text-current underline decoration-current decoration-2 underline-offset-4 hover:decoration-transparent",
};

export const textLinkStyles = (tone: NonNullable<TextLinkProps["tone"]> = "accent", className?: string): string =>
  cx("rounded-xs transition-colors dur-1 focus-visible:focus-ring", tones[tone], className);

export const TextLink = ({ href, tone, className, children, ...props }: TextLinkProps): React.JSX.Element => {
  const classes = textLinkStyles(tone, className);
  if (isExternalHref(href)) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
};
