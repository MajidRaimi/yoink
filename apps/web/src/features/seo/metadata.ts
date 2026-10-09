import type { Metadata } from "next";
import { site } from "@/shared/brand/site";
import { absoluteUrl, withTrailingSlash } from "@/shared/lib/routes";

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export const canonicalUrl = (path: string): string => absoluteUrl(site.url, withTrailingSlash(path.split("#")[0] ?? path));

export const brandedTitle = (title: string): string => (title.includes(site.name) ? title : `${title} · ${site.name}`);

export const pageMetadata = ({ title, description, path, type = "website", noIndex = false }: PageMetadataInput): Metadata => {
  const url = canonicalUrl(path);
  const shareTitle = brandedTitle(title);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: shareTitle,
      description,
      url,
      siteName: site.name,
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
};
