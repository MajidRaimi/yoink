import { createOgImage, contentType, size } from "@/lib/og";

export { contentType, size };
export const dynamic = "force-static";
export const alt = "yoink · How it works";

export default function Image() {
  return createOgImage({
    title: "How it works",
    subtitle: "Keychain snapshots, identity swaps, and managed env overrides.",
  });
}
