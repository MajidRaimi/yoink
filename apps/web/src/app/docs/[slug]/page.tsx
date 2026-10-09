import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPageView } from "@/features/docs/components/doc-page-view";
import { docMeta } from "@/features/docs/content";
import { JsonLd, breadcrumbLd, techArticleLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { ogContentType, ogSize } from "@/features/seo/og-meta";
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
  const base = pageMetadata({ title: doc.title, description: doc.description, path: docPath(doc.slug), type: "article" });
  const image = { url: `${docPath(doc.slug)}opengraph-image`, alt: `Yoink docs: ${doc.title}`, type: ogContentType, ...ogSize };
  return { ...base, openGraph: { ...base.openGraph, images: [image] }, twitter: { ...base.twitter, images: [image] } };
};

const DocPage = async ({ params }: DocPageProps): Promise<React.JSX.Element> => {
  const slug = await requireSlug(params);
  const doc = docMeta(slug);
  const path = docPath(slug);
  return (
    <>
      <JsonLd data={techArticleLd({ title: doc.title, description: doc.description, path })} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Docs", path: canonicalPath(routes.docs) },
          { name: doc.title, path },
        ])}
      />
      <DocPageView slug={slug} />
    </>
  );
};

export default DocPage;
