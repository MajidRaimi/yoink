import { describe, expect, test } from "bun:test";
import { buildHarnessFacts, buildModules, buildPresetFacts, FactsSourceError, renderModule, toLiteral, type HarnessSource } from "./gen-data";

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
      "harness-facts.gen.ts",
      "preset-facts.gen.ts",
    ]);
  });
});

const TABLE = [
  "| Harness | Id | Config yoink writes | Format | Protocols (in order of preference) | Default model |",
  "| --- | --- | --- | --- | --- | --- |",
  "| Crush | `crush` | `~/.config/crush/crush.json` | JSON | `openai-chat` | `models.large` |",
  "",
  "### Paths and overrides",
  "",
  "- **Crush** follows `CRUSH_GLOBAL_CONFIG`, then `XDG_CONFIG_HOME/crush`. yoink never touches `~/.local/share/crush`.",
].join("\n");

const crush: HarnessSource = {
  id: "crush",
  label: "Crush",
  protocols: ["openai-chat", "anthropic-messages"],
  experimental: false,
  exclusive: false,
  setsDefaultModel: true,
};

describe("facts", () => {
  test("harness facts join the adapter with its docs row and env overrides", () => {
    expect(buildHarnessFacts([crush], TABLE)).toEqual([
      {
        ...crush,
        protocols: ["openai-chat", "anthropic-messages"],
        configPath: "`~/.config/crush/crush.json`",
        format: "JSON",
        defaultModel: "`models.large`",
        envOverrides: ["CRUSH_GLOBAL_CONFIG", "XDG_CONFIG_HOME/crush"],
      },
    ]);
  });

  test("a harness missing from the docs table fails generation", () => {
    expect(() => buildHarnessFacts([{ ...crush, id: "nope" }], TABLE)).toThrow(FactsSourceError);
  });

  test("preset reach takes the first protocol in the harness order the preset offers", () => {
    const preset = { id: "x", label: "X", endpoints: [{ protocol: "anthropic-messages" as const, baseUrl: "https://x" }] };
    const codex: HarnessSource = { ...crush, id: "codex", protocols: ["openai-responses"] };
    expect(buildPresetFacts([preset], [crush, codex])).toEqual([
      {
        id: "x",
        label: "X",
        keyUrl: null,
        endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://x" }],
        reach: [
          { harness: "crush", protocol: "anthropic-messages" },
          { harness: "codex", protocol: null },
        ],
      },
    ]);
  });
});
