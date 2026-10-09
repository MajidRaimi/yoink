import type { ImageResponse } from "next/og";
import { createOgImage, ogContentType, ogSize } from "@/features/seo/og";
import { PAGE_OG_COPY } from "@/features/seo/og-copy";
import { site } from "@/shared/brand/site";

export const dynamic = "force-static";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = site.title;

const Image = (): ImageResponse => createOgImage(PAGE_OG_COPY.home);

export default Image;
