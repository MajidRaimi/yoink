import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryRoute, entryMetadata, entryStaticSlugs, isPublishedEntry } from "@/features/seo/entry-route";
import type { EntryRef } from "@/features/docs/collections";

export const dynamicParams = false;

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

const requireEntry = async (params: GuidePageProps["params"]): Promise<EntryRef> => {
  const { slug } = await params;
  const ref: EntryRef = { collection: "guides", slug };
  if (!isPublishedEntry(ref)) notFound();
  return ref;
};

export const generateStaticParams = (): { slug: string }[] => entryStaticSlugs("guides").map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: GuidePageProps): Promise<Metadata> => entryMetadata(await requireEntry(params));

const GuidePage = async ({ params }: GuidePageProps): Promise<React.JSX.Element> => <EntryRoute entryRef={await requireEntry(params)} />;

export default GuidePage;
