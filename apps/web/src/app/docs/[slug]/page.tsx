import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DOC_SLUGS, isDocSlug, type DocSlug } from "@/shared/lib/routes";
import { PlaceholderPage } from "@/shared/ui/placeholder-page";

export const dynamicParams = false;

type DocPageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = (): { slug: DocSlug }[] => DOC_SLUGS.map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: DocPageProps): Promise<Metadata> => {
  const { slug } = await params;
  return { title: slug, alternates: { canonical: `/docs/${slug}/` } };
};

const DocPage = async ({ params }: DocPageProps): Promise<React.JSX.Element> => {
  const { slug } = await params;
  if (!isDocSlug(slug)) notFound();
  return <PlaceholderPage title={slug} />;
};

export default DocPage;
