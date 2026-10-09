import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { collectSlopTargets, scanCss, scanFile, scanMarkdown, scanTypeScript, type SlopRule } from "./check-slop";

const rulesOf = (findings: readonly { rule: SlopRule }[]): readonly SlopRule[] => findings.map((finding) => finding.rule);

const SLASH = "/";
const lineComment = `${SLASH}${SLASH} note`;
const blockComment = `${SLASH}* note *${SLASH}`;

describe("scanTypeScript", () => {
  test("flags line and block comments but not URLs inside strings", () => {
    const source = [
      `const url = "https:${SLASH}${SLASH}yoink.codes";`,
      lineComment,
      `const value = 1; ${blockComment}`,
    ].join("\n");
    const findings = scanTypeScript("sample.ts", source);
    expect(rulesOf(findings)).toEqual(["comment", "comment"]);
    expect(findings.map((finding) => finding.line)).toEqual([2, 3]);
  });

  test("ignores comment-like JSX text and flags JSX expression comments", () => {
    const source = [
      "export const A = (): React.JSX.Element => (",
      `  <p>see https:${SLASH}${SLASH}yoink.codes and ${SLASH}${SLASH} this</p>`,
      ");",
      "export const B = (): React.JSX.Element => (",
      `  <div>{${blockComment}}</div>`,
      ");",
    ].join("\n");
    const findings = scanTypeScript("sample.tsx", source);
    expect(rulesOf(findings)).toEqual(["comment"]);
    expect(findings[0]?.line).toBe(5);
  });

  test("flags any in every type position", () => {
    const anyWord = ["a", "n", "y"].join("");
    const source = [
      `const a: ${anyWord} = 1;`,
      `const b = a as ${anyWord};`,
      `const c = <${anyWord}>b;`,
      `const d: Array<${anyWord}> = [];`,
      "const company = 'any company';",
    ].join("\n");
    expect(rulesOf(scanTypeScript("sample.ts", source))).toEqual(["any", "any", "any", "any"]);
  });

  test("flags banned imports and scroll listeners", () => {
    const source = [
      'import { X } from "lucide-react";',
      'import * as THREE from "three";',
      'import { Y } from "three-stdlib";',
      'window.addEventListener("scroll", () => undefined);',
      'element.addEventListener("click", () => undefined);',
    ].join("\n");
    expect(rulesOf(scanTypeScript("sample.ts", source))).toEqual(["banned-import", "banned-import", "scroll-listener"]);
  });

  test("flags dashes, emoji, gradient text, glass and banned copy", () => {
    const source = [
      `const a = "one \u2014 two";`,
      `const b = "\u{1F680} launch";`,
      `const c = "${["bg", "clip", "text"].join("-")} ${["backdrop", "blur", "md"].join("-")}";`,
      `export const D = (): React.JSX.Element => <p>${["Sim", "ply"].join("")} works</p>;`,
      'const e = "Arrows \u2191 \u2193 stay";',
    ].join("\n");
    expect(rulesOf(scanTypeScript("sample.tsx", source)).toSorted()).toEqual(
      (["backdrop-blur", "banned-copy", "dash", "emoji", "gradient-text"] as const satisfies readonly SlopRule[]).toSorted(),
    );
  });
});

describe("scanCss", () => {
  test("flags block comments outside strings only", () => {
    const source = [`a { content: "${blockComment}"; }`, blockComment, "b { color: red; }"].join("\n");
    const findings = scanCss("sample.css", source);
    expect(rulesOf(findings)).toEqual(["comment"]);
    expect(findings[0]?.line).toBe(2);
  });
});

describe("scanMarkdown", () => {
  test("checks banned copy in prose but not inside fenced code", () => {
    const fence = "`".repeat(3);
    const word = ["seam", "less"].join("");
    const source = [`A ${word} flow.`, fence, `${word}()`, fence, "Plain prose."].join("\n");
    const findings = scanMarkdown("doc.md", source);
    expect(rulesOf(findings)).toEqual(["banned-copy"]);
    expect(findings[0]?.line).toBe(1);
  });

  test("flags en dashes anywhere", () => {
    expect(rulesOf(scanMarkdown("doc.md", "1\u20132"))).toEqual(["dash"]);
  });
});

describe("scanFile", () => {
  const slashes = "/".repeat(2);

  test("parses tsconfig files as JSONC and reports comment positions", () => {
    const findings = scanFile("tsconfig.json", ["{", `  ${slashes} note`, '  "strict": true', "}"].join("\n"));
    expect(rulesOf(findings)).toEqual(["comment"]);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.column).toBe(3);
  });

  test("keeps the first line column of JSONC findings exact", () => {
    expect(scanFile("tsconfig.json", '{"a": "\u2014"}')[0]?.column).toBe(8);
  });

  test("scans JavaScript modules with the TypeScript scanner", () => {
    expect(rulesOf(scanFile("postcss.config.mjs", `${slashes} note\nexport default {};`))).toEqual(["comment"]);
  });

  test("flags markup comments in svg files", () => {
    expect(rulesOf(scanFile("icon.svg", `<svg>${"<!"}-- x --></svg>`))).toEqual(["comment"]);
  });
});

describe("collectSlopTargets", () => {
  test("covers config files, tokens, the root readme and public svgs", () => {
    const targets = collectSlopTargets();
    for (const suffix of [
      "apps/web/next.config.ts",
      "apps/web/postcss.config.mjs",
      "apps/web/e2e/tsconfig.json",
      "packages/tokens/tokens.css",
      "apps/web/public/icon.svg",
    ]) {
      expect(targets.some((target) => target.endsWith(suffix))).toBe(true);
    }
    expect(targets).toContain(resolve(import.meta.dir, "..", "..", "..", "README.md"));
  });
});
