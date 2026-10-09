import type { ImageResponse } from "next/og";
import { createOgImage, ogContentType, ogSize } from "@/features/seo/og";
import { PAGE_OG_COPY } from "@/features/seo/og-copy";
import { ogImageAlt } from "@/features/seo/og-meta";
import { DOWNLOAD_HEADING } from "@/features/download/components/download-page";

export const dynamic = "force-static";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogImageAlt(DOWNLOAD_HEADING);

const Image = (): ImageResponse => createOgImage(PAGE_OG_COPY.download);

export default Image;
