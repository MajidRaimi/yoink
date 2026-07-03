import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "yoink · Usage";

export default function Image() {
  return createOgImage({
    title: "Usage",
    subtitle: "The command set and how the daily workflows fit together.",
  });
}
