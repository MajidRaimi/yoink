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

type GuideOgImageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = (): { slug: string }[] => entryStaticSlugs("guides").map((slug) => ({ slug }));

const Image = async ({ params }: GuideOgImageProps): Promise<ImageResponse> => {
  const { slug } = await params;
  const ref: EntryRef = { collection: "guides", slug };
  if (!isPublishedEntry(ref)) notFound();
  return entryOgImage(ref);
};

export default Image;
