import { site } from "@/shared/brand/site";

export const ogSize = { width: 1200, height: 630 } as const;

export const ogContentType = "image/png";

export const ogImageAlt = (heading: string): string => `${site.qualifiedName}: ${heading}`;
