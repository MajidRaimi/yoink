import type { Metadata } from "next";
import { COMPARE_INDEX_SLUG } from "@/shared/lib/routes";
import type { ImageResponse } from "next/og";
import { collectionSlugs, type ContentCollectionId, type EntryRef } from "@/features/docs/collections";
import { EntryPageView } from "@/features/docs/components/entry-page-view";
import { entryDocument } from "@/features/docs/entry-document";
import { entryBreadcrumbs } from "@/features/docs/entry-navigation";
import type { EntryMeta } from "@/features/docs/entry-types";
import { compareToolList } from "@/features/docs/compare-tools";
import { faqPageGraph, faqNode, itemListNode, JsonLd, techArticleGraph, type JsonLdGraph, type JsonLdNode } from "./json-ld";
import { formatDisplayDate, type PageDates } from "./last-modified";
import { markdownTwinUrl } from "./llms";
import { pageMetadata } from "./metadata";
import { createOgImage } from "./og";
import { ogContentType, ogImageAlt, ogSize } from "./og-meta";
import { pageDates } from "./page-dates";

export class EntryNotFoundError extends Error {
  constructor(ref: EntryRef) {
    super(`No ${ref.collection} entry "${ref.slug}"`);
    this.name = "EntryNotFoundError";
  }
}

export const entryStaticSlugs = (collection: ContentCollectionId): readonly string[] =>
  collectionSlugs(collection).filter((slug) => !(collection === "compare" && slug === COMPARE_INDEX_SLUG));

export const isPublishedEntry = (ref: EntryRef): boolean =>
  ref.collection !== "docs" && entryStaticSlugs(ref.collection).includes(ref.slug);

export const entryMetadata = (ref: EntryRef): Metadata => {
  const { meta } = entryDocument(ref);
  const base = pageMetadata({ title: meta.title, seoTitle: meta.seoTitle, description: meta.description, path: meta.path, type: "article" });
  const image = { url: `${meta.path}opengraph-image`, alt: ogImageAlt(meta.title), type: ogContentType, ...ogSize };
  return {
    ...base,
    alternates: { ...base.alternates, types: { "text/markdown": markdownTwinUrl(meta.path) } },
    openGraph: { ...base.openGraph, images: [image] },
    twitter: { ...base.twitter, images: [image] },
  };
};

const pageInput = (meta: EntryMeta, dates: PageDates): Parameters<typeof techArticleGraph>[0] => ({
  title: meta.title,
  description: meta.description,
  path: meta.path,
  dates,
  breadcrumbs: entryBreadcrumbs(meta),
});

const extraNodes = (ref: EntryRef, meta: EntryMeta): readonly JsonLdNode[] => {
  const { faq, markdown } = entryDocument(ref);
  const tools = ref.collection === "compare" ? compareToolList(markdown) : [];
  return [
    ...(faq.length === 0 ? [] : [faqNode(meta.path, faq)]),
    ...(tools.length === 0 ? [] : [itemListNode(meta.path, tools)]),
  ];
};

export const entryJsonLd = (ref: EntryRef, dates: PageDates): JsonLdGraph => {
  const { meta, faq } = entryDocument(ref);
  if (ref.collection === "faq") return faqPageGraph({ ...pageInput(meta, dates), items: faq });
  return techArticleGraph(pageInput(meta, dates), extraNodes(ref, meta));
};

export type EntryRouteProps = {
  entryRef: EntryRef;
};

export const EntryRoute = ({ entryRef }: EntryRouteProps): React.JSX.Element => {
  const { meta } = entryDocument(entryRef);
  const dates = pageDates(meta.path);
  return (
    <>
      <JsonLd data={entryJsonLd(entryRef, dates)} />
      <EntryPageView entryRef={entryRef} updated={{ iso: dates.modified, label: formatDisplayDate(dates.modified) }} />
    </>
  );
};

export const entryOgImage = (ref: EntryRef): ImageResponse => {
  const { meta } = entryDocument(ref);
  return createOgImage({ title: meta.title, subtitle: meta.description });
};
