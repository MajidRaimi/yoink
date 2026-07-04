import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink · Interactive menu";

export default function Image() {
  return createOgImage({
    title: "Interactive menu",
    subtitle: "The keyboard-driven account list and its keymap.",
  });
}
