import { readdirSync, statSync, renameSync, readFileSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";

const outDir = join(process.cwd(), "out");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = walk(outDir);
const ogUrlPattern = /opengraph-image\?[0-9a-f]+/g;

let renamed = 0;
for (const file of files) {
  if (file.endsWith(`${sep}opengraph-image`)) {
    renameSync(file, `${file}.png`);
    renamed += 1;
  }
}

let rewritten = 0;
for (const file of files) {
  if (!file.endsWith(".html")) continue;
  const html = readFileSync(file, "utf8");
  const next = html.replace(ogUrlPattern, "opengraph-image.png");
  if (next !== html) {
    writeFileSync(file, next);
    rewritten += 1;
  }
}

console.log(`finalize-og: renamed ${renamed} images, rewrote ${rewritten} html files`);
