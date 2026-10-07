import { expect, test } from "bun:test";
import { discoverPreset, verifyPresetKey } from "../src/features/providers/preset-discovery";
import { findPreset, type ProviderPreset } from "../src/features/providers/presets";
import type { Fetcher } from "../src/features/providers/types";
import { YoinkError } from "../src/shared/errors";

type Route = { status: number; body?: unknown } | "network-error";

const createFetcher = (routes: Record<string, Route>): { fetcher: Fetcher; urls: string[] } => {
  const urls: string[] = [];
  const fetcher: Fetcher = async (input) => {
    urls.push(input);
    const route = routes[input.split("?")[0] ?? input] ?? { status: 404 };
    if (route === "network-error") throw new TypeError("fetch failed");
    return new Response(route.body === undefined ? "" : JSON.stringify(route.body), { status: route.status });
  };
  return { fetcher, urls };
};

const openRouter = (): ProviderPreset => {
  const preset = findPreset("openrouter");
  if (!preset) throw new Error("openrouter preset missing");
  return preset;
};

const PUBLIC_MODELS = { status: 200, body: { data: [{ id: "openai/gpt-5" }] } };

test("the OpenRouter preset checks the key against an authenticated endpoint", () => {
  expect(openRouter().authCheckUrl).toBe("https://openrouter.ai/api/v1/key");
});

test("discoverPreset rejects a bad OpenRouter key even though the model list is public", async () => {
  const { fetcher } = createFetcher({
    "https://openrouter.ai/api/v1/models": PUBLIC_MODELS,
    "https://openrouter.ai/api/v1/key": { status: 401 },
  });
  const discovery = discoverPreset(openRouter(), "typo", fetcher);
  await expect(discovery).rejects.toBeInstanceOf(YoinkError);
  await expect(discovery).rejects.toThrow("rejected the API key (401)");
});

test("discoverPreset rejects a forbidden key", async () => {
  const { fetcher } = createFetcher({
    "https://openrouter.ai/api/v1/models": PUBLIC_MODELS,
    "https://openrouter.ai/api/v1/key": { status: 403 },
  });
  await expect(discoverPreset(openRouter(), "k", fetcher)).rejects.toThrow("(403)");
});

test("discoverPreset returns the preset endpoints and models for a valid OpenRouter key", async () => {
  const { fetcher, urls } = createFetcher({
    "https://openrouter.ai/api/v1/models": PUBLIC_MODELS,
    "https://openrouter.ai/api/v1/key": { status: 200, body: { data: {} } },
  });
  const result = await discoverPreset(openRouter(), "good", fetcher);
  expect(result.endpoints).toEqual(openRouter().endpoints);
  expect(result.models.map((model) => model.id)).toEqual(["openai/gpt-5"]);
  expect(urls).toContain("https://openrouter.ai/api/v1/key");
});

test("verifyPresetKey fails when the key check endpoint is unreachable", async () => {
  const { fetcher } = createFetcher({ "https://openrouter.ai/api/v1/key": "network-error" });
  await expect(verifyPresetKey(openRouter(), "k", fetcher)).rejects.toThrow("Could not reach OpenRouter");
});

test("presets without an auth check rely on the authenticated model listing only", async () => {
  const preset = findPreset("deepseek");
  if (!preset) throw new Error("deepseek preset missing");
  const { fetcher, urls } = createFetcher({ "https://api.deepseek.com/v1/models": { status: 401 } });
  await expect(discoverPreset(preset, "bad", fetcher)).rejects.toThrow("Provider rejected the request (401");
  expect(urls).toEqual(["https://api.deepseek.com/v1/models"]);
});
