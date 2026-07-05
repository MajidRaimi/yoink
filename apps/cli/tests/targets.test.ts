import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { targets } from "../scripts/targets";

const shimSource = readFileSync(join(import.meta.dir, "../bin/yoink.js"), "utf8");

const supportedSetEntries = (): string[] => {
  const entries = shimSource.match(/new Set\(\[([^\]]*)\]\)/)?.[1];
  return entries?.match(/"[^"]+"/g) ?? [];
};

test("every target platform key appears in the shim source", () => {
  for (const t of targets) {
    expect(shimSource).toContain(`${t.npmOs}-${t.cpu}`);
  }
});

test("shim supported set covers exactly every target platform key", () => {
  const keys = new Set(targets.map((t) => `${t.npmOs}-${t.cpu}`));
  const entries = new Set(supportedSetEntries().map((e) => e.replace(/"/g, "")));
  expect(entries).toEqual(keys);
});

test("every target npm name follows the platform package convention", () => {
  for (const t of targets) {
    const npmPlatform = t.npmOs === "win32" ? "windows" : t.npmOs;
    const suffix = t.libc === "musl" ? "-musl" : "";
    expect(t.npmName).toBe(`yoink-cli-${npmPlatform}-${t.cpu}${suffix}`);
  }
});

test("the shim maps win32 to the windows package name", () => {
  expect(shimSource).toContain('process.platform === "win32" ? "windows"');
});
