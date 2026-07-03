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

test("shim supported set size matches target count", () => {
  expect(supportedSetEntries().length).toBe(targets.length);
});

test("every target npm name follows the platform package convention", () => {
  for (const t of targets) {
    expect(t.npmName).toBe(`yoink-cli-${t.npmOs}-${t.cpu}`);
  }
});
