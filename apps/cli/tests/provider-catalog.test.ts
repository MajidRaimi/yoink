import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCatalog, lookupModelSpecs, matchModelSpecs, retryMarkerPath } from "../src/features/providers/catalog";
import type { Fetcher } from "../src/features/providers/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const catalog = {
  openai: {
    models: {
      "gpt-4o": {
        id: "gpt-4o",
        name: "GPT-4o",
        limit: { context: 128000, output: 16384 },
        reasoning: false,
        modalities: { input: ["text", "image", "pdf"] },
      },
    },
  },
  moonshot: {
    models: {
      "kimi-k2": { id: "kimi-k2", name: "Kimi K2", limit: { context: 0, output: 0 }, reasoning: false, modalities: { input: ["text"] } },
    },
  },
  openrouter: {
    models: {
      "moonshotai/Kimi-K2": {
        id: "moonshotai/Kimi-K2",
        name: "Kimi K2 (OR)",
        limit: { context: 262144, output: 65536 },
        reasoning: true,
        modalities: { input: ["text"] },
      },
    },
  },
};

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "yoink-catalog-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("matchModelSpecs uses an exact id match", () => {
  const [spec] = matchModelSpecs([{ id: "gpt-4o", name: "gpt-4o" }], catalog);
  expect(spec).toEqual({
    id: "gpt-4o",
    name: "GPT-4o",
    contextWindow: 128000,
    maxOutput: 16384,
    reasoning: false,
    input: ["text", "image"],
  });
});

test("matchModelSpecs strips org prefixes case-insensitively and prefers non-zero limits", () => {
  const [spec] = matchModelSpecs([{ id: "kimi-k2", name: "My Kimi" }], catalog);
  expect(spec).toMatchObject({ name: "My Kimi", contextWindow: 262144, maxOutput: 65536, reasoning: true });
  const [prefixed] = matchModelSpecs([{ id: "openai/GPT-4o", name: "openai/GPT-4o" }], catalog);
  expect(prefixed).toMatchObject({ id: "openai/GPT-4o", contextWindow: 128000, input: ["text", "image"] });
});

test("matchModelSpecs falls back to defaults", () => {
  expect(matchModelSpecs([{ id: "unknown", name: "unknown" }], null)).toEqual([
    { id: "unknown", name: "unknown", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text"] },
  ]);
});

test("matchModelSpecs treats zero limits as missing", () => {
  const zeroOnly = { moonshot: catalog.moonshot };
  expect(matchModelSpecs([{ id: "kimi-k2", name: "kimi-k2" }], zeroOnly)[0]).toMatchObject({
    name: "Kimi K2",
    contextWindow: 128000,
    maxOutput: 32000,
  });
});

const sharedModelCatalog = {
  reseller: {
    api: "https://api.reseller.example/v1",
    models: {
      "deepseek/deepseek-chat": {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek (reseller)",
        limit: { context: 64000, output: 4096 },
        modalities: { input: ["text"] },
      },
      "glm-4.6": { id: "glm-4.6", name: "GLM (reseller)", limit: { context: 32000, output: 2048 } },
    },
  },
  aggregator: {
    models: {
      "deepseek-chat": { id: "deepseek-chat", name: "DeepSeek (aggregator)", limit: { context: 100000, output: 8000 } },
    },
  },
  deepseek: {
    models: {
      "deepseek-chat": { id: "deepseek-chat", name: "DeepSeek Chat", limit: { context: 128000 } },
    },
  },
  zai: {
    api: "https://api.z.ai/api/paas/v4",
    models: {
      "glm-4.6": { id: "glm-4.6", name: "GLM-4.6", limit: { context: 204800 } },
    },
  },
};

test("matchModelSpecs prefers an exact id over a more complete bare-id match from another host", () => {
  const [spec] = matchModelSpecs([{ id: "deepseek-chat", name: "deepseek-chat" }], {
    reseller: sharedModelCatalog.reseller,
    deepseek: sharedModelCatalog.deepseek,
  });
  expect(spec).toMatchObject({ name: "DeepSeek Chat", contextWindow: 128000, maxOutput: 32000 });
});

test("matchModelSpecs prefers the provider matching the preset over other exact ids", () => {
  const models = [{ id: "deepseek-chat", name: "deepseek-chat" }];
  expect(matchModelSpecs(models, sharedModelCatalog)[0]).toMatchObject({ contextWindow: 100000, maxOutput: 8000 });
  expect(matchModelSpecs(models, sharedModelCatalog, { presetId: "deepseek" })[0]).toMatchObject({
    name: "DeepSeek Chat",
    contextWindow: 128000,
  });
});

test("matchModelSpecs prefers the provider matching the base URL host", () => {
  const models = [{ id: "glm-4.6", name: "glm-4.6" }];
  expect(matchModelSpecs(models, sharedModelCatalog, { baseUrls: ["https://api.z.ai/api/paas/v4"] })[0]).toMatchObject({
    name: "GLM-4.6",
    contextWindow: 204800,
  });
  expect(
    matchModelSpecs(models, sharedModelCatalog, { baseUrls: ["https://api.reseller.example/v1"] })[0],
  ).toMatchObject({ name: "GLM (reseller)", contextWindow: 32000, maxOutput: 2048 });
  const [bare] = matchModelSpecs([{ id: "deepseek-chat", name: "deepseek-chat" }], sharedModelCatalog, {
    baseUrls: ["https://api.reseller.example/v1"],
  });
  expect(bare).toMatchObject({ contextWindow: 100000 });
});

test("matchModelSpecs matches the provider key from the base URL domain", () => {
  const [spec] = matchModelSpecs([{ id: "deepseek-chat", name: "deepseek-chat" }], sharedModelCatalog, {
    baseUrls: ["https://api.deepseek.com/anthropic"],
  });
  expect(spec).toMatchObject({ name: "DeepSeek Chat", contextWindow: 128000 });
});

const countingFetcher = (response: () => Response): { fetcher: Fetcher; calls: () => number } => {
  let calls = 0;
  return {
    fetcher: async () => {
      calls++;
      return response();
    },
    calls: () => calls,
  };
};

test("loadCatalog downloads once and serves the cache within the TTL", async () => {
  const cachePath = join(dir, "cache", "models-dev.json");
  const { fetcher, calls } = countingFetcher(() => new Response(JSON.stringify(catalog)));
  expect(await loadCatalog({ fetcher, cachePath })).toEqual(catalog);
  expect(await loadCatalog({ fetcher, cachePath })).toEqual(catalog);
  expect(calls()).toBe(1);
  expect(await Bun.file(cachePath).json()).toEqual(catalog);
});

test("loadCatalog refreshes an expired cache", async () => {
  const cachePath = join(dir, "models-dev.json");
  await Bun.write(cachePath, JSON.stringify({ stale: { models: {} } }));
  const { fetcher, calls } = countingFetcher(() => new Response(JSON.stringify(catalog)));
  const later = Date.now() + 2 * DAY_MS;
  expect(await loadCatalog({ fetcher, cachePath, now: () => later })).toEqual(catalog);
  expect(calls()).toBe(1);
});

test("loadCatalog falls back to a stale cache when the download fails", async () => {
  const cachePath = join(dir, "models-dev.json");
  await Bun.write(cachePath, JSON.stringify(catalog));
  const old = new Date(Date.now() - 3 * DAY_MS);
  await utimes(cachePath, old, old);
  const { fetcher } = countingFetcher(() => new Response("oops", { status: 500 }));
  expect(await loadCatalog({ fetcher, cachePath })).toEqual(catalog);
});

const staleCache = async (cachePath: string): Promise<void> => {
  await Bun.write(cachePath, JSON.stringify(catalog));
  const old = new Date(Date.now() - 3 * DAY_MS);
  await utimes(cachePath, old, old);
};

test("loadCatalog backs off retrying after a failed refresh of a stale cache", async () => {
  const cachePath = join(dir, "models-dev.json");
  await staleCache(cachePath);
  const failing = countingFetcher(() => new Response("oops", { status: 500 }));
  const start = Date.now();
  expect(await loadCatalog({ fetcher: failing.fetcher, cachePath, now: () => start })).toEqual(catalog);
  expect(await loadCatalog({ fetcher: failing.fetcher, cachePath, now: () => start + 30 * 60 * 1000 })).toEqual(catalog);
  expect(failing.calls()).toBe(1);
  const fresh = { fresh: { models: {} } };
  const working = countingFetcher(() => new Response(JSON.stringify(fresh)));
  expect(await loadCatalog({ fetcher: working.fetcher, cachePath, now: () => start + 2 * 60 * 60 * 1000 })).toEqual(fresh);
  expect(working.calls()).toBe(1);
  expect(await Bun.file(retryMarkerPath(cachePath)).exists()).toBe(false);
});

test("loadCatalog uses a short timeout when a stale cache can serve as a fallback", async () => {
  const cachePath = join(dir, "models-dev.json");
  const signals: (AbortSignal | null | undefined)[] = [];
  const fetcher: Fetcher = async (_input, init) => {
    signals.push(init?.signal);
    return new Response(JSON.stringify(catalog));
  };
  await loadCatalog({ fetcher, cachePath });
  await staleCache(cachePath);
  const realTimeout = AbortSignal.timeout;
  const timeouts: number[] = [];
  AbortSignal.timeout = (ms: number): AbortSignal => {
    timeouts.push(ms);
    return realTimeout.call(AbortSignal, ms);
  };
  try {
    await rm(cachePath);
    await loadCatalog({ fetcher, cachePath });
    await staleCache(cachePath);
    await loadCatalog({ fetcher, cachePath });
  } finally {
    AbortSignal.timeout = realTimeout;
  }
  expect(timeouts).toEqual([10000, 3000]);
  expect(signals).toHaveLength(3);
});

test("lookupModelSpecs uses defaults with no cache and no network", async () => {
  const fetcher: Fetcher = async () => {
    throw new TypeError("offline");
  };
  const specs = await lookupModelSpecs([{ id: "gpt-4o", name: "gpt-4o" }], { fetcher, cachePath: join(dir, "none.json") });
  expect(specs[0]).toMatchObject({ contextWindow: 128000, maxOutput: 32000 });
});
