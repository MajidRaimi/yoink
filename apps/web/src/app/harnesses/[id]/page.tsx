import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryRoute, entryMetadata, entryStaticSlugs, isPublishedEntry } from "@/features/seo/entry-route";
import type { EntryRef } from "@/features/docs/collections";

export const dynamicParams = false;

type HarnessPageProps = {
  params: Promise<{ id: string }>;
};

const requireEntry = async (params: HarnessPageProps["params"]): Promise<EntryRef> => {
  const { id } = await params;
  const ref: EntryRef = { collection: "harnesses", slug: id };
  if (!isPublishedEntry(ref)) notFound();
  return ref;
};

export const generateStaticParams = (): { id: string }[] => entryStaticSlugs("harnesses").map((id) => ({ id }));

export const generateMetadata = async ({ params }: HarnessPageProps): Promise<Metadata> => entryMetadata(await requireEntry(params));

const HarnessPage = async ({ params }: HarnessPageProps): Promise<React.JSX.Element> => <EntryRoute entryRef={await requireEntry(params)} />;

export default HarnessPage;
