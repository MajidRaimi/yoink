import type { Route } from "next";

export type ExternalHref = `https://${string}` | `mailto:${string}`;

export type Href = Route | ExternalHref;

export const isExternalHref = (href: Href): href is ExternalHref =>
  href.startsWith("https://") || href.startsWith("mailto:");
