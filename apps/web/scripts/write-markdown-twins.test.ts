import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDocs } from "@/features/docs/content";
import { twinFile, writeMarkdownTwins } from "./write-markdown-twins";

const created: string[] = [];

const tempOut = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "twins-"));
  created.push(dir);
  return dir;
};

afterEach(() => {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("writeMarkdownTwins", () => {
  test("writes each twin to docs/<slug>/index.md", () => {
    const outDir = tempOut();
    const count = writeMarkdownTwins(outDir, [{ slug: "usage", markdown: "# Usage\n" }]);
    expect(count).toBe(1);
    expect(twinFile(outDir, { slug: "usage", markdown: "" })).toBe(join(outDir, "docs", "usage", "index.md"));
    expect(readFileSync(join(outDir, "docs", "usage", "index.md"), "utf8")).toBe("# Usage\n");
  });

  test("writes every published doc by default", () => {
    const outDir = tempOut();
    expect(writeMarkdownTwins(outDir)).toBe(getDocs().length);
    expect(readFileSync(join(outDir, "docs", "getting-started", "index.md"), "utf8")).toStartWith("# Getting started\n");
  });

  test("refuses a missing out directory", () => {
    expect(() => writeMarkdownTwins(join(tmpdir(), "missing-out-dir-for-twins"))).toThrow();
  });
});
