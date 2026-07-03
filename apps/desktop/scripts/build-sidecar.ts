import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, statSync } from "node:fs";

const desktopDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = join(desktopDir, "..", "cli");
const binariesDir = join(desktopDir, "src-tauri", "binaries");
mkdirSync(binariesDir, { recursive: true });

const triples = [
  { bunTarget: "bun-darwin-arm64", triple: "aarch64-apple-darwin" },
  { bunTarget: "bun-darwin-x64", triple: "x86_64-apple-darwin" },
];

const requested = process.argv[2];
const hostArch = process.arch === "arm64" ? "arm64" : "x64";
const only = requested === "host" ? hostArch : requested;
const entry = join(cliDir, "src", "index.ts");

const newestSourceMtime = (): number => {
  const glob = new Bun.Glob("src/**/*.ts");
  let newest = 0;
  for (const file of glob.scanSync({ cwd: cliDir })) {
    const mtime = statSync(join(cliDir, file)).mtimeMs;
    if (mtime > newest) newest = mtime;
  }
  return newest;
};

const sourceMtime = newestSourceMtime();

for (const { bunTarget, triple } of triples) {
  if (only && !triple.includes(only) && !bunTarget.includes(only)) continue;
  const outfile = join(binariesDir, `yoink-${triple}`);
  if (existsSync(outfile) && statSync(outfile).mtimeMs > sourceMtime) {
    console.log(`sidecar ${triple} up to date`);
    continue;
  }
  const result = Bun.spawnSync(
    ["bun", "build", entry, "--compile", "--minify", `--target=${bunTarget}`, `--outfile=${outfile}`],
    { cwd: cliDir, stdout: "inherit", stderr: "inherit" },
  );
  if (result.exitCode !== 0) {
    throw new Error(`sidecar build failed for ${triple}`);
  }
}

console.log(`sidecar binaries ready in ${binariesDir}`);
