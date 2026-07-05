#!/usr/bin/env node
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);

const key = `${process.platform}-${process.arch}`;
const supported = new Set([
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-x64",
]);

if (!supported.has(key)) {
  console.error(`yoink does not support ${key}.`);
  console.error("Supported platforms: macOS (arm64, x64), Linux (arm64, x64), Windows (arm64, x64).");
  process.exit(1);
}

const isMuslLinux = () => {
  if (process.platform !== "linux") return false;
  try {
    const report = process.report?.getReport();
    const header = typeof report === "string" ? JSON.parse(report).header : report?.header;
    if (header && "glibcVersionRuntime" in header) return !header.glibcVersionRuntime;
  } catch {}
  return existsSync("/lib/ld-musl-x86_64.so.1") || existsSync("/lib/ld-musl-aarch64.so.1");
};

const npmPlatform = process.platform === "win32" ? "windows" : process.platform;
const libcSuffix = isMuslLinux() ? "-musl" : "";
const target = `yoink-cli-${npmPlatform}-${process.arch}${libcSuffix}`;
const binaryName = process.platform === "win32" ? "yoink.exe" : "yoink";

let binary;
try {
  binary = join(dirname(require.resolve(`${target}/package.json`)), binaryName);
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
