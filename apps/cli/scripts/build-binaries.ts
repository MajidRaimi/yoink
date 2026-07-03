import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(cliDir, "dist");
mkdirSync(distDir, { recursive: true });

const targets = [
  { name: "darwin-arm64", bunTarget: "bun-darwin-arm64" },
  { name: "darwin-x64", bunTarget: "bun-darwin-x64" },
];

const checksums: string[] = [];

for (const target of targets) {
  const asset = `yoink-${target.name}`;
  const outfile = join(distDir, asset);
  const result = Bun.spawnSync(
    [
      "bun",
      "build",
      "src/index.ts",
      "--compile",
      "--minify",
      `--target=${target.bunTarget}`,
      `--outfile=${outfile}`,
    ],
    { cwd: cliDir, stdout: "inherit", stderr: "inherit" },
  );

  if (result.exitCode !== 0) {
    throw new Error(`build failed for ${target.name}`);
  }

  const digest = createHash("sha256").update(readFileSync(outfile)).digest("hex");
  checksums.push(`${digest}  ${asset}`);
}

writeFileSync(join(distDir, "checksums.txt"), `${checksums.join("\n")}\n`);
console.log(`built ${targets.length} binaries into ${distDir}`);
