import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Download Yoink for macOS";

export default function Image() {
  return createOgImage({
    title: "Download Yoink",
    subtitle: "The menu bar app for Claude Code accounts",
  });
}
