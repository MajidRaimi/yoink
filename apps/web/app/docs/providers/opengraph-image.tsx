import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink · Providers";

export default function Image() {
  return createOgImage({
    title: "Providers",
    subtitle: "Add an API key once and use it in pi, opencode, codex, Claude Code, Qwen Code, Zed, and more.",
  });
}
