import type { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import type { EntryRef } from "@/features/docs/collections";
import { entryOgImage, entryStaticSlugs, isPublishedEntry } from "@/features/seo/entry-route";
import { ogContentType, ogSize } from "@/features/seo/og-meta";

export const dynamic = "force-static";
export const dynamicParams = false;
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Yoink for AI coding";

type ProviderOgImageProps = {
  params: Promise<{ id: string }>;
};

export const generateStaticParams = (): { id: string }[] => entryStaticSlugs("providers").map((id) => ({ id }));

const Image = async ({ params }: ProviderOgImageProps): Promise<ImageResponse> => {
  const { id } = await params;
  const ref: EntryRef = { collection: "providers", slug: id };
  if (!isPublishedEntry(ref)) notFound();
  return entryOgImage(ref);
};

export default Image;
