import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";

export type FinalizeOgResult = {
  renamed: number;
  rewritten: number;
};

const OG_FILE_NAME = "opengraph-image";

const OG_URL_PATTERN = /opengraph-image(?:\?[0-9A-Za-z_-]+)?(?![.\w-])/g;

const REWRITTEN_EXTENSIONS = [".html", ".txt"] as const;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

export const rewriteOgReferences = (content: string): string => content.replace(OG_URL_PATTERN, `${OG_FILE_NAME}.png`);

const isOgImageFile = (file: string): boolean => file.endsWith(`${sep}${OG_FILE_NAME}`);

const isRewritable = (file: string): boolean => REWRITTEN_EXTENSIONS.some((extension) => file.endsWith(extension));

export const finalizeOg = (outDir: string): FinalizeOgResult => {
  if (!existsSync(outDir)) throw new Error(`finalize-og: ${outDir} does not exist. Run next build first.`);
  const files = walk(outDir);

  const ogFiles = files.filter(isOgImageFile);
  for (const file of ogFiles) renameSync(file, `${file}.png`);

  let rewritten = 0;
  for (const file of files.filter(isRewritable)) {
    const content = readFileSync(file, "utf8");
    const next = rewriteOgReferences(content);
    if (next === content) continue;
    writeFileSync(file, next);
    rewritten += 1;
  }

  return { renamed: ogFiles.length, rewritten };
};

if (import.meta.main) {
  const { renamed, rewritten } = finalizeOg(join(process.cwd(), "out"));
  console.log(`finalize-og: renamed ${renamed} images, rewrote ${rewritten} files`);
}
