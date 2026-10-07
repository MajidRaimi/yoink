import { expect, test } from "bun:test";
import { disconnectTargets, linkedHarnessIds } from "../src/features/harnesses/links";
import type { HarnessId } from "../src/features/profiles/types";
import { makeProvider } from "./support/provider-fixture";

const connectedAt = "2026-01-01T00:00:00.000Z";

const status = (id: HarnessId, connected: boolean, exclusive = false) => ({ id, connected, exclusive });

const statuses = [
  status("claude-code", false, true),
  status("pi", false),
  status("omp", false),
  status("opencode", true),
  status("codex", false),
];

test("linkedHarnessIds keeps a recorded file harness whose entry was removed by hand", () => {
  const provider = makeProvider({ connections: { pi: { connectedAt } } });
  expect(linkedHarnessIds(provider, statuses)).toEqual(["pi", "opencode"]);
});

test("linkedHarnessIds leaves a recorded exclusive harness unchecked once another profile took it over", () => {
  const provider = makeProvider({ connections: { "claude-code": { connectedAt } } });
  expect(linkedHarnessIds(provider, statuses)).toEqual(["opencode"]);
});

test("disconnectTargets covers recorded connections that are no longer live", () => {
  const provider = makeProvider({ connections: { pi: { connectedAt }, "claude-code": { connectedAt } } });
  expect(disconnectTargets(provider, statuses)).toEqual(["pi", "claude-code", "opencode"]);
});

test("disconnectTargets is empty when nothing is recorded or live", () => {
  expect(disconnectTargets(makeProvider(), statuses.map((entry) => ({ ...entry, connected: false })))).toEqual([]);
});
