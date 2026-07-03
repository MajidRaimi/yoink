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

const provenance = process.env.GITHUB_ACTIONS === "true" ? ["--provenance"] : [];

const alreadyPublished = (name: string) => {
  const result = Bun.spawnSync(["npm", "view", `${name}@${version}`, "version"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.exitCode === 0 && result.stdout.toString().trim() === version;
};

const publish = (name: string, cwd: string) => {
  if (alreadyPublished(name)) {
    console.log(`${name}@${version} already published, skipping`);
    return;
  }
  const result = Bun.spawnSync(["npm", "publish", "--access", "public", ...provenance], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    throw new Error(`npm publish failed for ${name}`);
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
  publish(name, pkgDir);
}

mainPkg.optionalDependencies = {
  "yoink-cli-darwin-arm64": version,
  "yoink-cli-darwin-x64": version,
};
writeFileSync(mainPkgPath, `${JSON.stringify(mainPkg, null, 2)}\n`);
publish(mainPkg.name, cliDir);

console.log(`published ${mainPkg.name}@${version} with 2 platform packages`);
