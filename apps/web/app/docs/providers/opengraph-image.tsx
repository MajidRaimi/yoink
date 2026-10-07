import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink · External providers";

export default function Image() {
  return createOgImage({
    title: "External providers",
    subtitle: "Run OpenRouter, Ollama, or any Anthropic-compatible API inside Claude Code.",
  });
}
