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
  const line = { label: "pi", experimental: false, configPath: "/x/models.json" };
  const active = stripAnsi(formatHarnessLine({ ...line, active: true, state: "connected" }));
  const idle = stripAnsi(formatHarnessLine({ ...line, active: false, state: "available" }));
  expect(active).toBe(`● ${"pi".padEnd(14)} connected  /x/models.json`);
  expect(idle).toBe(`○ ${"pi".padEnd(14)} available  /x/models.json`);
});

test("formatHarnessLine tags experimental harnesses after the state", () => {
  const line = stripAnsi(
    formatHarnessLine({ active: false, label: "goose", experimental: true, state: "available", configPath: "/x/config.yaml" }),
  );
  expect(line).toBe(`○ ${"goose".padEnd(14)} available experimental  /x/config.yaml`);
});
