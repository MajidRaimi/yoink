import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(cliDir, "dist");
mkdirSync(distDir, { recursive: true });

const targets = [
  { name: "darwin-arm64", bunTarget: "bun-darwin-arm64" },
  { name: "darwin-x64", bunTarget: "bun-darwin-x64" },
];

const run = (cmd: string[], cwd: string) => {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) {
    throw new Error(`command failed: ${cmd.join(" ")}`);
  }
};

const checksums: string[] = [];

for (const target of targets) {
  const rawBinary = join(distDir, `yoink-${target.name}`);
  run(
    ["bun", "build", "src/index.ts", "--compile", "--minify", `--target=${target.bunTarget}`, `--outfile=${rawBinary}`],
    cliDir,
  );

  const stageDir = join(distDir, `stage-${target.name}`);
  mkdirSync(stageDir, { recursive: true });
  const stagedBinary = join(stageDir, "yoink");
  copyFileSync(rawBinary, stagedBinary);
  chmodSync(stagedBinary, 0o755);

  const tarball = `yoink-${target.name}.tar.gz`;
  run(["tar", "-czf", join(distDir, tarball), "-C", stageDir, "yoink"], cliDir);

  const digest = createHash("sha256").update(readFileSync(join(distDir, tarball))).digest("hex");
  checksums.push(`${digest}  ${tarball}`);
}

writeFileSync(join(distDir, "checksums.txt"), `${checksums.join("\n")}\n`);
console.log(`built ${targets.length} binaries + tarballs into ${distDir}`);
