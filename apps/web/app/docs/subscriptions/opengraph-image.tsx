import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink · Subscriptions";

export default function Image() {
  return createOgImage({
    title: "Subscriptions",
    subtitle: "Switch ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins.",
  });
}
