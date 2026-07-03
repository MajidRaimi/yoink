import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { archiveFile, rawBinaryFile, targets } from "./targets";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(cliDir, "dist");
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const run = (cmd: string[], cwd: string) => {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) {
    throw new Error(`command failed: ${cmd.join(" ")}`);
  }
};

const checksums: string[] = [];

for (const target of targets) {
  const rawBinary = join(distDir, rawBinaryFile(target));
  run(
    ["bun", "build", "src/index.ts", "--compile", "--minify", `--target=${target.bunTarget}`, `--outfile=${rawBinary}`],
    cliDir,
  );

  const stageDir = join(distDir, `stage-${target.name}`);
  mkdirSync(stageDir, { recursive: true });
  const stagedBinary = join(stageDir, target.binaryName);
  copyFileSync(rawBinary, stagedBinary);
  if (target.npmOs !== "win32") {
    chmodSync(stagedBinary, 0o755);
  }

  const archive = archiveFile(target);
  if (target.archive === "zip") {
    run(["zip", "-j", "-X", join(distDir, archive), stagedBinary], cliDir);
  } else {
    run(["tar", "--no-xattrs", "-czf", join(distDir, archive), "-C", stageDir, target.binaryName], cliDir);
  }

  const digest = createHash("sha256").update(readFileSync(join(distDir, archive))).digest("hex");
  checksums.push(`${digest}  ${archive}`);

  rmSync(stageDir, { recursive: true, force: true });
}

writeFileSync(join(distDir, "checksums.txt"), `${checksums.join("\n")}\n`);
console.log(`built ${targets.length} binaries + archives into ${distDir}`);
