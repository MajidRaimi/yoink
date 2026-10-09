import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryRoute, entryMetadata, entryStaticSlugs, isPublishedEntry } from "@/features/seo/entry-route";
import type { EntryRef } from "@/features/docs/collections";

export const dynamicParams = false;

type ComparisonPageProps = {
  params: Promise<{ slug: string }>;
};

const requireEntry = async (params: ComparisonPageProps["params"]): Promise<EntryRef> => {
  const { slug } = await params;
  const ref: EntryRef = { collection: "compare", slug };
  if (!isPublishedEntry(ref)) notFound();
  return ref;
};

export const generateStaticParams = (): { slug: string }[] => entryStaticSlugs("compare").map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: ComparisonPageProps): Promise<Metadata> => entryMetadata(await requireEntry(params));

const ComparisonPage = async ({ params }: ComparisonPageProps): Promise<React.JSX.Element> => <EntryRoute entryRef={await requireEntry(params)} />;

export default ComparisonPage;
