import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLI_COMMANDS, COMMAND_GROUPS, commandsInGroup, filterCommands } from "./commands";
import { HARNESS_ID_ROWS, PRESET_ID_ROWS, TOOL_IDS } from "./ids";
import { REFERENCE_SECTIONS } from "./sections";

const cliDir = join(import.meta.dir, "..", "..", "..", "..", "cli", "src", "cli");

const readCli = (file: string): string => readFileSync(join(cliDir, file), "utf8");

const routerCases = (): string[] => [...readCli("router.ts").matchAll(/case "([^"]+)":/g)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

const parserFlags = (): string[] => {
  const sources = ["provider-flags.ts", "account-flags.ts", "external-flags.ts", "provider-commands.ts", "json-commands.ts", "json-output.ts"];
  const flags = sources.flatMap((file) => [...readCli(file).matchAll(/"(--[a-z][a-z-]*)"/g)].flatMap((match) => (match[1] === undefined ? [] : [match[1]])));
  return [...new Set(flags), "--allow-tracked", "--force", "--tool"];
};

const documentedNames = (): Set<string> =>
  new Set(CLI_COMMANDS.flatMap((command) => (command.name === null ? command.aliases : [command.name, ...command.aliases])));

describe("CLI commands", () => {
  test("every router command and alias is documented", () => {
    const names = documentedNames();
    for (const name of routerCases()) {
      expect(names.has(name)).toBe(true);
    }
  });

  test("every documented command name exists in the router", () => {
    const cases = new Set(routerCases());
    for (const name of documentedNames()) {
      expect(cases.has(name)).toBe(true);
    }
  });

  test("every flag the parsers accept is documented", () => {
    const documented = new Set(CLI_COMMANDS.flatMap((command) => command.flags.map((flag) => flag.flag)));
    for (const flag of parserFlags()) {
      expect({ flag, documented: documented.has(flag) }).toEqual({ flag, documented: true });
    }
  });

  test("ids are unique and every group has commands", () => {
    const ids = CLI_COMMANDS.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of COMMAND_GROUPS) {
      expect(commandsInGroup(CLI_COMMANDS, group.id).length).toBeGreaterThan(0);
    }
  });

  test("every example starts a yoink call", () => {
    for (const command of CLI_COMMANDS) {
      expect(command.example).toMatch(/(^| \| )yoink\b/);
    }
  });

  test("copy has no em or en dashes", () => {
    for (const command of CLI_COMMANDS) {
      const text = [command.summary, command.example, ...command.flags.map((flag) => flag.description)].join(" ");
      expect(/[\u2013\u2014]/.test(text)).toBe(false);
    }
  });
});

describe("filterCommands", () => {
  test("an empty query keeps every command", () => {
    expect(filterCommands(CLI_COMMANDS, "  ")).toBe(CLI_COMMANDS);
  });

  test("matches aliases, flags and words, all terms required", () => {
    expect(filterCommands(CLI_COMMANDS, "rm").map((command) => command.id)).toContain("remove");
    expect(filterCommands(CLI_COMMANDS, "--set").map((command) => command.id)).toEqual(["models"]);
    expect(filterCommands(CLI_COMMANDS, "--tool gemini").map((command) => command.id)).toEqual(["current"]);
    expect(filterCommands(CLI_COMMANDS, "nothing-matches-this")).toEqual([]);
    expect(filterCommands(CLI_COMMANDS, "alias rm").map((command) => command.id)).toContain("remove");
  });
});

describe("reference ids", () => {
  test("tool ids are claude plus every subscription tool", () => {
    expect(TOOL_IDS.map((tool) => tool.id)).toEqual(["claude", "codex", "kimi", "gemini", "copilot"]);
  });

  test("harness and preset ids come from the generated data", () => {
    expect(HARNESS_ID_ROWS.length).toBe(13);
    expect(PRESET_ID_ROWS.length).toBeGreaterThan(0);
    for (const row of [...HARNESS_ID_ROWS, ...PRESET_ID_ROWS]) {
      expect(row.protocols.length).toBeGreaterThan(0);
    }
  });

  test("section anchors are unique", () => {
    const ids = REFERENCE_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
