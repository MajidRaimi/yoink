import { expect, test } from "bun:test";
import { discoverProvider, presetSummaries } from "../src/features/providers/discovery";
import { PROVIDER_PRESETS } from "../src/features/providers/presets";
import type { Fetcher } from "../src/features/providers/types";
import { YoinkError } from "../src/shared/errors";

type Route = { status: number; body?: unknown };

const createFetcher = (routes: Record<string, Route>): { fetcher: Fetcher; urls: string[] } => {
  const urls: string[] = [];
  const fetcher: Fetcher = async (input, init) => {
    urls.push(input);
    const url = input.split("?")[0] ?? input;
    const route = routes[`${init?.method ?? "GET"} ${url}`] ?? { status: 404 };
    return new Response(route.body === undefined ? "" : JSON.stringify(route.body), { status: route.status });
  };
  return { fetcher, urls };
};

const unreachable: Fetcher = async () => {
  throw new Error("network must not be used");
};

test("presetSummaries exposes only id, label and endpoints", () => {
  const summaries = presetSummaries();
  expect(summaries.map((summary) => summary.id)).toEqual(PROVIDER_PRESETS.map((preset) => preset.id));
  for (const summary of summaries) {
    expect(Object.keys(summary).sort()).toEqual(["endpoints", "id", "label"]);
    for (const endpoint of summary.endpoints) expect(Object.keys(endpoint).sort()).toEqual(["baseUrl", "protocol"]);
  }
});

test("presetSummaries returns copies that cannot mutate the presets", () => {
  const [first] = presetSummaries();
  first?.endpoints.splice(0);
  expect(presetSummaries()[0]?.endpoints.length).toBeGreaterThan(0);
});

test("discoverProvider with a preset lists models from its first endpoint", async () => {
  const { fetcher, urls } = createFetcher({
    "GET https://api.kimi.com/coding/v1/models": { status: 200, body: { data: [{ id: "kimi-k2", name: "Kimi K2" }] } },
  });
  const result = await discoverProvider({ kind: "preset", presetId: "kimi-code" }, "sk", { fetcher });
  expect(result).toEqual({
    endpoints: [
      { protocol: "openai-chat", baseUrl: "https://api.kimi.com/coding/v1" },
      { protocol: "anthropic-messages", baseUrl: "https://api.kimi.com/coding" },
    ],
    models: [{ id: "kimi-k2", name: "Kimi K2" }],
  });
  expect(urls).toEqual(["https://api.kimi.com/coding/v1/models"]);
});

test("discoverProvider validates a preset key through its auth check", async () => {
  const { fetcher } = createFetcher({
    "GET https://openrouter.ai/api/v1/models": { status: 200, body: { data: [{ id: "a/b" }] } },
    "GET https://openrouter.ai/api/v1/key": { status: 401 },
  });
  await expect(discoverProvider({ kind: "preset", presetId: "openrouter" }, "bad", { fetcher })).rejects.toThrow(
    /rejected the API key/,
  );
});

test("discoverProvider rejects unknown presets and invalid base URLs before any request", async () => {
  await expect(
    discoverProvider({ kind: "preset", presetId: "nope" }, "sk", { fetcher: unreachable }),
  ).rejects.toBeInstanceOf(YoinkError);
  await expect(
    discoverProvider({ kind: "base-url", baseUrl: "ftp://x" }, "sk", { fetcher: unreachable }),
  ).rejects.toThrow(/Invalid --base-url/);
});

test("discoverProvider probes a custom base URL", async () => {
  const { fetcher } = createFetcher({
    "GET https://api.example.com/v1/models": { status: 200, body: { data: [{ id: "m-1" }] } },
    "POST https://api.example.com/v1/chat/completions": {
      status: 200,
      body: { object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "p" } }] },
    },
  });
  const result = await discoverProvider({ kind: "base-url", baseUrl: "https://api.example.com" }, "sk", { fetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://api.example.com/v1" }]);
  expect(result.models).toEqual([{ id: "m-1", name: "m-1" }]);
});
