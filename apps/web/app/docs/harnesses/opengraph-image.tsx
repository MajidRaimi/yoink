import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink · Harnesses";

export default function Image() {
  return createOgImage({
    title: "Harnesses",
    subtitle: "What Yoink writes into pi, opencode, codex, Claude Code, Qwen Code, Zed, and more.",
  });
}
