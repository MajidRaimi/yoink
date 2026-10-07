import { expect, test } from "bun:test";
import { pruneStaleDefaultModels, selectedDefaultModel } from "../src/features/profiles/default-model";
import { syncLegacyFields } from "../src/features/profiles/store";
import { kimiModel, makeProvider, visionModel } from "./support/provider-fixture";

const connectedAt = "2026-01-01T00:00:00.000Z";

test("selectedDefaultModel returns the connection default while it is still selected", () => {
  const provider = makeProvider({ connections: { "claude-code": { connectedAt, defaultModel: visionModel.id } } });
  expect(selectedDefaultModel(provider, "claude-code")).toBe(visionModel.id);
});

test("selectedDefaultModel ignores a connection default that was removed from the provider", () => {
  const provider = makeProvider({
    models: [kimiModel],
    connections: { "claude-code": { connectedAt, defaultModel: visionModel.id } },
  });
  expect(selectedDefaultModel(provider, "claude-code")).toBeUndefined();
  expect(selectedDefaultModel(provider, "pi")).toBeUndefined();
});

test("pruneStaleDefaultModels drops only defaults that are no longer selected", () => {
  const pruned = pruneStaleDefaultModels(
    {
      "claude-code": { connectedAt, defaultModel: visionModel.id },
      pi: { connectedAt, defaultModel: kimiModel.id },
      codex: { connectedAt },
    },
    [kimiModel],
  );
  expect(pruned).toEqual({
    "claude-code": { connectedAt },
    pi: { connectedAt, defaultModel: kimiModel.id },
    codex: { connectedAt },
  });
});

test("syncLegacyFields does not persist a removed claude-code default as the legacy model", () => {
  const provider = makeProvider({
    model: visionModel.id,
    models: [kimiModel],
    connections: { "claude-code": { connectedAt, defaultModel: visionModel.id } },
  });
  expect(syncLegacyFields(provider).model).toBe(kimiModel.id);
});

test("syncLegacyFields keeps a claude-code default that is still selected", () => {
  const provider = makeProvider({ connections: { "claude-code": { connectedAt, defaultModel: visionModel.id } } });
  expect(syncLegacyFields(provider).model).toBe(visionModel.id);
});
