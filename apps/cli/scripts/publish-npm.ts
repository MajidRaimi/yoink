import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chmodSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { rawBinaryFile, targets } from "./targets";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(cliDir, "dist");
const mainPkgPath = join(cliDir, "package.json");
const mainPkg = JSON.parse(readFileSync(mainPkgPath, "utf8"));
const version = mainPkg.version as string;

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
  const pkgDir = join(distDir, "npm", target.npmName);
  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    join(pkgDir, "package.json"),
    `${JSON.stringify(
      {
        name: target.npmName,
        version,
        description: `yoink CLI binary for ${target.name}`,
        license: "MIT",
        os: [target.npmOs],
        cpu: [target.cpu],
        ...(target.libc ? { libc: [target.libc] } : {}),
        files: [target.binaryName],
        repository: { type: "git", url: "git+https://github.com/MajidRaimi/yoink.git" },
      },
      null,
      2,
    )}\n`,
  );

  const binary = join(pkgDir, target.binaryName);
  copyFileSync(join(distDir, rawBinaryFile(target)), binary);
  if (target.npmOs !== "win32") {
    chmodSync(binary, 0o755);
  }
  publish(target.npmName, pkgDir);
}

mainPkg.optionalDependencies = Object.fromEntries(targets.map((t) => [t.npmName, version]));
writeFileSync(mainPkgPath, `${JSON.stringify(mainPkg, null, 2)}\n`);
publish(mainPkg.name, cliDir);

console.log(`published ${mainPkg.name}@${version} with ${targets.length} platform packages`);
