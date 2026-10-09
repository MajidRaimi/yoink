import type { ImageResponse } from "next/og";
import { entryOgImage } from "@/features/seo/entry-route";
import { ogContentType, ogSize } from "@/features/seo/og-meta";

export const dynamic = "force-static";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Yoink for AI coding";

const Image = (): ImageResponse => entryOgImage({ collection: "faq", slug: "faq" });

export default Image;
