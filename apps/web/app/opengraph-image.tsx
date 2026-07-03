import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "yoink · switch Claude Code accounts, fast";

export default function Image() {
  return createOgImage({
    title: "Switch Claude Code accounts, fast",
    subtitle:
      "Snapshot logins into profiles, switch in a keystroke, and run any Anthropic-compatible model, OpenRouter or Ollama, through Claude Code.",
  });
}
