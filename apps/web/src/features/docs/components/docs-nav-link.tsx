"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/shared/lib/cx";
import { withTrailingSlash } from "@/shared/lib/routes";

export type DocsNavLinkProps = {
  href: Route;
  label: string;
};

export const DocsNavLink = ({ href, label }: DocsNavLinkProps): React.JSX.Element => {
  const pathname = usePathname();
  const current = withTrailingSlash(pathname) === withTrailingSlash(href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cx(
        "-ml-px block border-l py-1.5 pl-3 text-sm transition-colors dur-1 focus-visible:focus-ring",
        current
          ? "border-brand-text font-medium text-foreground"
          : "border-transparent text-muted hover:border-hairline-strong hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
};
