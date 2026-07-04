import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink documentation";

export default function Image() {
  return createOgImage({
    title: "Everything Yoink does",
    subtitle: "Guides and reference for the Yoink CLI, from the first install to the exact files a switch touches.",
  });
}
