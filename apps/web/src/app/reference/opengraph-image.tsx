import type { ImageResponse } from "next/og";
import { createOgImage, ogContentType, ogSize } from "@/features/seo/og";
import { PAGE_OG_COPY } from "@/features/seo/og-copy";
import { ogImageAlt } from "@/features/seo/og-meta";
import { REFERENCE_TITLE } from "@/features/reference/components/reference-page";

export const dynamic = "force-static";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogImageAlt(REFERENCE_TITLE);

const Image = (): ImageResponse => createOgImage(PAGE_OG_COPY.reference);

export default Image;
