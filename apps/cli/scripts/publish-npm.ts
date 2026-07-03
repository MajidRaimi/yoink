import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chmodSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(cliDir, "dist");
const mainPkgPath = join(cliDir, "package.json");
const mainPkg = JSON.parse(readFileSync(mainPkgPath, "utf8"));
const version = mainPkg.version as string;

const targets = [
  { name: "darwin-arm64", cpu: "arm64" },
  { name: "darwin-x64", cpu: "x64" },
];

const publish = (cwd: string) => {
  const result = Bun.spawnSync(["npm", "publish", "--access", "public"], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    throw new Error(`npm publish failed in ${cwd}`);
  }
};

for (const target of targets) {
  const name = `yoink-cli-${target.name}`;
  const pkgDir = join(distDir, "npm", name);
  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    join(pkgDir, "package.json"),
    `${JSON.stringify(
      {
        name,
        version,
        description: `yoink CLI binary for ${target.name}`,
        license: "MIT",
        os: ["darwin"],
        cpu: [target.cpu],
        files: ["yoink"],
        repository: { type: "git", url: "git+https://github.com/MajidRaimi/yoink.git" },
      },
      null,
      2,
    )}\n`,
  );

  const binary = join(pkgDir, "yoink");
  copyFileSync(join(distDir, `yoink-${target.name}`), binary);
  chmodSync(binary, 0o755);
  publish(pkgDir);
}

mainPkg.optionalDependencies = {
  "yoink-cli-darwin-arm64": version,
  "yoink-cli-darwin-x64": version,
};
writeFileSync(mainPkgPath, `${JSON.stringify(mainPkg, null, 2)}\n`);
publish(cliDir);

console.log(`published yoink-cli@${version} with 2 platform packages`);
