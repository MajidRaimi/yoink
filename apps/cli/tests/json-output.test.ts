import { afterEach, expect, spyOn, test } from "bun:test";
import { formatHarnessLine, JSON_SWITCH, printJson } from "../src/cli/json-output";

const logSpy = spyOn(console, "log");

afterEach(() => {
  logSpy.mockReset();
});

const stripAnsi = (text: string): string => text.replace(/\u001b\[[0-9;]*m/g, "");

test("JSON_SWITCH is the --json flag", () => {
  expect(JSON_SWITCH).toBe("--json");
});

test("printJson writes one pretty-printed JSON document", () => {
  logSpy.mockImplementation(() => undefined);
  printJson({ id: "fuse", models: ["m1"] });
  expect(logSpy).toHaveBeenCalledTimes(1);
  expect(logSpy.mock.calls[0]?.[0]).toBe(JSON.stringify({ id: "fuse", models: ["m1"] }, null, 2));
});

test("formatHarnessLine pads the label and marks active harnesses", () => {
  const active = stripAnsi(formatHarnessLine({ active: true, label: "pi", state: "connected", configPath: "/x/models.json" }));
  const idle = stripAnsi(formatHarnessLine({ active: false, label: "pi", state: "available", configPath: "/x/models.json" }));
  expect(active).toBe(`● ${"pi".padEnd(12)} connected  /x/models.json`);
  expect(idle).toBe(`○ ${"pi".padEnd(12)} available  /x/models.json`);
});
