import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPageView } from "@/features/docs/components/doc-page-view";
import { docMeta } from "@/features/docs/content";
import { JsonLd, techArticleGraph } from "@/features/seo/json-ld";
import { formatDisplayDate } from "@/features/seo/last-modified";
import { pageMetadata } from "@/features/seo/metadata";
import { ogContentType, ogImageAlt, ogSize } from "@/features/seo/og-meta";
import { markdownTwinUrl } from "@/features/seo/llms";
import { pageDates } from "@/features/seo/page-dates";
import { DOC_SLUGS, canonicalPath, docPath, isDocSlug, routes, type DocSlug } from "@/shared/lib/routes";

export const dynamicParams = false;

type DocPageProps = {
  params: Promise<{ slug: string }>;
};

const requireSlug = async (params: DocPageProps["params"]): Promise<DocSlug> => {
  const { slug } = await params;
  if (!isDocSlug(slug)) notFound();
  return slug;
};

export const generateStaticParams = (): { slug: DocSlug }[] => DOC_SLUGS.map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: DocPageProps): Promise<Metadata> => {
  const doc = docMeta(await requireSlug(params));
  const base = pageMetadata({
    title: doc.title,
    seoTitle: doc.seoTitle,
    description: doc.description,
    path: docPath(doc.slug),
    type: "article",
  });
  const image = { url: `${docPath(doc.slug)}opengraph-image`, alt: ogImageAlt(doc.title), type: ogContentType, ...ogSize };
  return {
    ...base,
    alternates: { ...base.alternates, types: { "text/markdown": markdownTwinUrl(doc.slug) } },
    openGraph: { ...base.openGraph, images: [image] },
    twitter: { ...base.twitter, images: [image] },
  };
};

const DocPage = async ({ params }: DocPageProps): Promise<React.JSX.Element> => {
  const slug = await requireSlug(params);
  const doc = docMeta(slug);
  const path = docPath(slug);
  const dates = pageDates(path);
  return (
    <>
      <JsonLd
        data={techArticleGraph({
          title: doc.title,
          description: doc.description,
          path,
          dates,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Docs", path: canonicalPath(routes.docs) },
            { name: doc.title, path },
          ],
        })}
      />
      <DocPageView slug={slug} updated={{ iso: dates.modified, label: formatDisplayDate(dates.modified) }} />
    </>
  );
};

export default DocPage;
