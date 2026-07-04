import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "Yoink · CLI reference";

export default function Image() {
  return createOgImage({
    title: "CLI reference",
    subtitle: "Every Yoink command, alias, argument, and the menu keymap.",
  });
}
