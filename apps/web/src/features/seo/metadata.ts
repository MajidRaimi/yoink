import type { Metadata } from "next";
import { site } from "@/shared/brand/site";
import { absoluteUrl, withTrailingSlash } from "@/shared/lib/routes";

export type PageMetadataInput = {
  title: string;
  seoTitle?: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export type SiteVerification = {
  google: string;
  bing: string;
};

const BING_VERIFICATION_NAME = "msvalidate.01";

export const TITLE_TEMPLATE = `%s · ${site.titleSuffix}`;

export const canonicalUrl = (path: string): string => absoluteUrl(site.url, withTrailingSlash(path.split("#")[0] ?? path));

export const brandedTitle = (title: string): string =>
  title.includes(site.name) ? title : TITLE_TEMPLATE.replace("%s", title);

export const documentTitle = ({ title, seoTitle }: Pick<PageMetadataInput, "title" | "seoTitle">): string =>
  seoTitle ?? brandedTitle(title);

export const verificationMetadata = ({ google, bing }: SiteVerification): Metadata["verification"] => {
  const entries = {
    ...(google.length > 0 ? { google } : {}),
    ...(bing.length > 0 ? { other: { [BING_VERIFICATION_NAME]: bing } } : {}),
  };
  return Object.keys(entries).length > 0 ? entries : undefined;
};

export const pageMetadata = ({ title, seoTitle, description, path, type = "website", noIndex = false }: PageMetadataInput): Metadata => {
  const url = canonicalUrl(path);
  const fullTitle = documentTitle({ title, seoTitle });
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.qualifiedName,
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
};
