import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(cliDir, "..", "..");

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error("usage: bun run apps/cli/scripts/release.ts <major.minor.patch>");
}

const git = (args: string[]) => {
  const result = Bun.spawnSync(["git", ...args], { cwd: repoRoot, stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed`);
  }
};

const cliPkgPath = join(cliDir, "package.json");
const cliPkg = JSON.parse(readFileSync(cliPkgPath, "utf8"));
cliPkg.version = version;
writeFileSync(cliPkgPath, `${JSON.stringify(cliPkg, null, 2)}\n`);

const sitePath = join(repoRoot, "apps", "web", "lib", "site.ts");
const site = readFileSync(sitePath, "utf8");
const nextSite = site.replace(/version:\s*"\d+\.\d+\.\d+"/, `version: "${version}"`);
if (nextSite === site) {
  throw new Error(`could not find a version field to bump in ${sitePath}`);
}
writeFileSync(sitePath, nextSite);

const tag = `v${version}`;
git(["add", cliPkgPath, sitePath]);
git(["commit", "-m", `release: ${tag}`]);
git(["tag", tag]);
git(["push", "origin", "main"]);
git(["push", "origin", tag]);

console.log(`released ${tag}`);
