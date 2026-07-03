import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "yoink · Getting started";

export default function Image() {
  return createOgImage({
    title: "Getting started",
    subtitle: "Install yoink and switch your first Claude Code account.",
  });
}
