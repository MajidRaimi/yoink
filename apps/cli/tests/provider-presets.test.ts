import { expect, test } from "bun:test";
import { normalizeEndpointUrl } from "../src/features/harnesses/endpoint";
import { findPreset, PROVIDER_PRESETS } from "../src/features/providers/presets";

test("preset ids are unique", () => {
  const ids = PROVIDER_PRESETS.map((preset) => preset.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("preset endpoint URLs are already normalized for their protocol", () => {
  for (const preset of PROVIDER_PRESETS) {
    for (const endpoint of preset.endpoints) {
      expect(normalizeEndpointUrl(endpoint.protocol, endpoint.baseUrl)).toBe(endpoint.baseUrl);
    }
  }
});

test("findPreset looks presets up by id", () => {
  expect(findPreset("zai")?.endpoints).toContainEqual({ protocol: "openai-chat", baseUrl: "https://api.z.ai/api/paas/v4" });
  expect(findPreset("missing")).toBeUndefined();
});
