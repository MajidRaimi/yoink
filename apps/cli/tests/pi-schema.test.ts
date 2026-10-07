import { expect, test } from "bun:test";
import { buildPiProviderEntry } from "../src/features/harnesses/adapters/pi-schema";
import { kimiModel, makeProvider } from "./support/provider-fixture";

const chatEndpoint = { protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" } as const;

const handMadeEntry = {
  name: "Old Fuse",
  baseUrl: "https://old.fuse.test/v1",
  api: "openai-responses",
  apiKey: "OLD_KEY",
  headers: { "X-Org": "acme" },
  authHeader: true,
  compat: { supportsDeveloperRole: false },
  models: [{ id: kimiModel.id, name: "Old Kimi", cost: { input: 1 } }, { id: "dropped-model" }],
};

test("buildPiProviderEntry keeps unmanaged provider keys from the existing entry", () => {
  const entry = buildPiProviderEntry(makeProvider({ models: [kimiModel] }), chatEndpoint, handMadeEntry);
  expect(entry).toEqual({
    name: "Fuse",
    baseUrl: "https://api.fuse.test/v1",
    api: "openai-completions",
    apiKey: "sk-test-fuse",
    headers: { "X-Org": "acme" },
    authHeader: true,
    compat: { supportsDeveloperRole: false },
    models: [
      {
        id: kimiModel.id,
        name: "Kimi K3",
        reasoning: true,
        input: ["text"],
        contextWindow: 1048576,
        maxTokens: 32768,
        cost: { input: 1 },
      },
    ],
  });
});

test("buildPiProviderEntry keeps the existing key order", () => {
  const entry = buildPiProviderEntry(makeProvider(), chatEndpoint, handMadeEntry);
  expect(Object.keys(entry)).toEqual(["name", "baseUrl", "api", "apiKey", "headers", "authHeader", "compat", "models"]);
});

test("buildPiProviderEntry ignores a missing or non-object existing entry", () => {
  const fresh = buildPiProviderEntry(makeProvider(), chatEndpoint, undefined);
  expect(buildPiProviderEntry(makeProvider(), chatEndpoint, "garbage")).toEqual(fresh);
  expect(buildPiProviderEntry(makeProvider(), chatEndpoint, ["garbage"])).toEqual(fresh);
  expect(Object.keys(fresh)).toEqual(["name", "baseUrl", "api", "apiKey", "models"]);
});
