import { expect, test } from "bun:test";
import { resolveProviderEndpoints, type ProviderProbe } from "../src/features/providers/endpoint-resolution";
import { findPreset } from "../src/features/providers/presets";

const failingProbe: ProviderProbe = async () => {
  throw new Error("probe should not run");
};

test("resolveProviderEndpoints uses a preset's endpoints and label without probing", async () => {
  const preset = findPreset("openai");
  const resolved = await resolveProviderEndpoints({ name: "oa", preset: "openai", protocols: [] }, "key", failingProbe);
  expect(resolved).toEqual({ endpoints: preset?.endpoints ?? [], displayName: "OpenAI" });
});

test("resolveProviderEndpoints rejects an unknown preset", async () => {
  await expect(resolveProviderEndpoints({ name: "x", preset: "nope", protocols: [] }, "key", failingProbe)).rejects.toThrow(
    'Unknown preset "nope".',
  );
});

test("resolveProviderEndpoints normalizes explicit protocols without probing", async () => {
  const resolved = await resolveProviderEndpoints(
    { name: "fuse", baseUrl: "https://api.fuse.test/v1/", protocols: ["anthropic-messages", "openai-chat"], displayName: "Fuse" },
    "key",
    failingProbe,
  );
  expect(resolved.displayName).toBe("Fuse");
  expect(resolved.endpoints.map((endpoint) => endpoint.protocol)).toEqual(["anthropic-messages", "openai-chat"]);
  expect(resolved.endpoints[0]?.baseUrl).toBe("https://api.fuse.test");
  expect(resolved.endpoints[1]?.baseUrl).toBe("https://api.fuse.test/v1");
});

test("resolveProviderEndpoints probes the base URL when no protocol is given", async () => {
  const calls: { baseUrl: string; token: string }[] = [];
  const probe: ProviderProbe = async (input) => {
    calls.push({ baseUrl: input.baseUrl, token: input.token });
    return { endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }], models: [] };
  };
  const resolved = await resolveProviderEndpoints({ name: "fuse", baseUrl: "https://api.fuse.test", protocols: [] }, "key", probe);
  expect(calls).toEqual([{ baseUrl: "https://api.fuse.test", token: "key" }]);
  expect(resolved).toEqual({ endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }], displayName: "fuse" });
});
