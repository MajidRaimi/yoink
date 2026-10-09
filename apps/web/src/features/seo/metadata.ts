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

export const pageMetadata = ({ title, description, path, type = "website", noIndex = false }: PageMetadataInput): Metadata => {
  const url = canonicalUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
};
