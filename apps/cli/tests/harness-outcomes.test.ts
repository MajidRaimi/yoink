import { expect, test } from "bun:test";
import { countFailures, formatOutcome, formatOutcomes, harnessLabel } from "../src/features/harnesses/outcomes";
import type { HarnessOutcome } from "../src/features/harnesses/sync";

const outcomes: HarnessOutcome[] = [
  { id: "pi", ok: true },
  { id: "codex", ok: false, message: "no responses endpoint" },
];

test("formatOutcome uses the adapter label for both success and failure", () => {
  expect(formatOutcome({ id: "pi", ok: true }, "Connected")).toEqual({ ok: true, text: `Connected ${harnessLabel("pi")}` });
  expect(formatOutcome({ id: "codex", ok: false, message: "boom" }, "Connected")).toEqual({
    ok: false,
    text: `${harnessLabel("codex")}: boom`,
  });
  expect(harnessLabel("codex")).not.toBe("");
});

test("formatOutcomes applies the label style to successes only", () => {
  const lines = formatOutcomes(outcomes, "Synced", { label: (label) => `[${label}]` });
  expect(lines[0]?.text).toBe(`Synced [${harnessLabel("pi")}]`);
  expect(lines[1]?.text).toBe(`${harnessLabel("codex")}: no responses endpoint`);
});

test("countFailures counts failed outcomes", () => {
  expect(countFailures(outcomes)).toBe(1);
  expect(countFailures([])).toBe(0);
});

test("formatOutcome keeps a connect notice on successful outcomes", () => {
  expect(formatOutcome({ id: "zed", ok: true, notice: "Set FUSE_API_KEY" }, "Connected")).toEqual({
    ok: true,
    text: `Connected ${harnessLabel("zed")}`,
    notice: "Set FUSE_API_KEY",
  });
});
