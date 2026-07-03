import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "yoink documentation";

export default function Image() {
  return createOgImage({
    title: "Everything yoink does",
    subtitle: "Guides and reference for the yoink CLI, from the first install to the exact files a switch touches.",
  });
}
