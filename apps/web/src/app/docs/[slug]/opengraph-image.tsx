import type { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { createOgImage, ogContentType, ogSize } from "@/features/seo/og";
import { docOgCopy } from "@/features/seo/og-copy";
import { DOC_SLUGS, isDocSlug, type DocSlug } from "@/shared/lib/routes";

export const dynamic = "force-static";
export const dynamicParams = false;
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Yoink docs";

type DocOgImageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = (): { slug: DocSlug }[] => DOC_SLUGS.map((slug) => ({ slug }));

const Image = async ({ params }: DocOgImageProps): Promise<ImageResponse> => {
  const { slug } = await params;
  if (!isDocSlug(slug)) notFound();
  return createOgImage(docOgCopy(slug));
};

export default Image;
