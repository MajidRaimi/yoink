import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { markdownTwinPath, markdownTwins, type MarkdownTwin } from "@/features/seo/llms";

const WEB_ROOT = resolve(import.meta.dir, "..");

export const twinFile = (outDir: string, twin: MarkdownTwin): string =>
  join(outDir, ...markdownTwinPath(twin.slug).split("/").filter((part) => part.length > 0));

export const writeMarkdownTwins = (outDir: string, twins: readonly MarkdownTwin[] = markdownTwins()): number => {
  if (!existsSync(outDir)) throw new Error(`write-markdown-twins: ${outDir} does not exist. Run next build first.`);
  for (const twin of twins) {
    const file = twinFile(outDir, twin);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, twin.markdown);
  }
  return twins.length;
};

if (import.meta.main) {
  const count = writeMarkdownTwins(join(WEB_ROOT, "out"));
  console.log(`markdown twins: wrote ${count} files`);
}
