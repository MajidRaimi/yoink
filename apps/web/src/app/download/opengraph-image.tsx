import type { ImageResponse } from "next/og";
import { createOgImage, ogContentType, ogSize } from "@/features/seo/og";
import { PAGE_OG_COPY } from "@/features/seo/og-copy";

export const dynamic = "force-static";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Download Yoink";

const Image = (): ImageResponse => createOgImage(PAGE_OG_COPY.download);

export default Image;
