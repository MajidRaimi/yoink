import { describe, expect, test } from "bun:test";
import { buildModules, renderModule, toLiteral } from "./gen-data";

describe("toLiteral", () => {
  test("renders primitives as JSON", () => {
    expect(toLiteral("a\"b")).toBe('"a\\"b"');
    expect(toLiteral(3)).toBe("3");
    expect(toLiteral(null)).toBe("null");
  });

  test("keeps primitive arrays inline and quotes non identifier keys", () => {
    expect(toLiteral({ "kimi-code": ["x", "y"], plain: true })).toBe('{\n  "kimi-code": ["x", "y"],\n  plain: true,\n}');
  });

  test("breaks object arrays across lines", () => {
    expect(toLiteral([{ id: "a" }])).toBe('[\n  {\n    id: "a",\n  },\n]');
  });
});

describe("renderModule", () => {
  test("emits an as const export followed by type lines and a trailing newline", () => {
    expect(renderModule("X", [], ["export type Y = 1;"])).toBe("export const X = [] as const;\n\nexport type Y = 1;\n");
  });

  test("imports the contract type and gates the value with satisfies", () => {
    expect(renderModule("X", [], [], { imports: ["A", "B"], satisfies: "readonly A[]" })).toBe(
      'import type { A, B } from "@/shared/contract";\n\nexport const X = [] as const satisfies readonly A[];\n\n',
    );
  });
});

describe("buildModules", () => {
  test("is deterministic across calls", () => {
    expect(buildModules()).toEqual(buildModules());
  });

  test("covers every generated file", () => {
    expect(buildModules().map((generated) => generated.fileName)).toEqual([
      "harnesses.gen.ts",
      "presets.gen.ts",
      "subscriptions.gen.ts",
      "groups.gen.ts",
    ]);
  });
});
