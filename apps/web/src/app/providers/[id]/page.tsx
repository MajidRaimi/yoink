import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryRoute, entryMetadata, entryStaticSlugs, isPublishedEntry } from "@/features/seo/entry-route";
import type { EntryRef } from "@/features/docs/collections";

export const dynamicParams = false;

type ProviderPageProps = {
  params: Promise<{ id: string }>;
};

const requireEntry = async (params: ProviderPageProps["params"]): Promise<EntryRef> => {
  const { id } = await params;
  const ref: EntryRef = { collection: "providers", slug: id };
  if (!isPublishedEntry(ref)) notFound();
  return ref;
};

export const generateStaticParams = (): { id: string }[] => entryStaticSlugs("providers").map((id) => ({ id }));

export const generateMetadata = async ({ params }: ProviderPageProps): Promise<Metadata> => entryMetadata(await requireEntry(params));

const ProviderPage = async ({ params }: ProviderPageProps): Promise<React.JSX.Element> => <EntryRoute entryRef={await requireEntry(params)} />;

export default ProviderPage;
