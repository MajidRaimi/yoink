#!/usr/bin/env node
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);

if (process.platform !== "darwin") {
  console.error("yoink runs on macOS only.");
  process.exit(1);
}

const target = `yoink-cli-${process.platform}-${process.arch}`;

let binary;
try {
  binary = join(dirname(require.resolve(`${target}/package.json`)), "yoink");
} catch {
  binary = "";
}

if (!binary || !existsSync(binary)) {
  console.error(`yoink could not find its binary for ${process.platform}-${process.arch}.`);
  console.error("Reinstall with: npm install -g yoink-cli");
  process.exit(1);
}

try {
  execFileSync(binary, process.argv.slice(2), { stdio: "inherit" });
} catch (error) {
  process.exit(typeof error.status === "number" ? error.status : 1);
}
