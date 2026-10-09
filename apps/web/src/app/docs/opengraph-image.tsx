import type { ImageResponse } from "next/og";
import { createOgImage, ogContentType, ogSize } from "@/features/seo/og";
import { PAGE_OG_COPY } from "@/features/seo/og-copy";
import { ogImageAlt } from "@/features/seo/og-meta";
import { DOCS_INDEX_TITLE } from "@/features/docs/components/docs-index-view";

export const dynamic = "force-static";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogImageAlt(DOCS_INDEX_TITLE);

const Image = (): ImageResponse => createOgImage(PAGE_OG_COPY.docs);

export default Image;
