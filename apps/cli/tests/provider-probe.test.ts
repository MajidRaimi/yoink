import { expect, test } from "bun:test";
import { fetchProviderModels, probeProvider } from "../src/features/providers/probe";
import type { Fetcher } from "../src/features/providers/types";
import { YoinkError } from "../src/shared/errors";

type Route = { status: number; body?: unknown } | "network-error";

type RecordedRequest = { method: string; url: string; headers: Record<string, string>; body: unknown };

const createFetcher = (routes: Record<string, Route>): { fetcher: Fetcher; requests: RecordedRequest[] } => {
  const requests: RecordedRequest[] = [];
  const fetcher: Fetcher = async (input, init) => {
    const method = init?.method ?? "GET";
    const url = input.split("?")[0] ?? input;
    requests.push({
      method,
      url: input,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    });
    const route = routes[`${method} ${url}`] ?? { status: 404 };
    if (route === "network-error") throw new TypeError("fetch failed");
    return new Response(route.body === undefined ? "" : JSON.stringify(route.body), { status: route.status });
  };
  return { fetcher, requests };
};

const chatSuccess = { object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "p" } }] };
const responsesSuccess = { object: "response", output: [], error: null };
const messagesSuccess = { type: "message", role: "assistant", content: [{ type: "text", text: "p" }] };

test("probeProvider detects OpenAI style endpoints from a bare base URL", async () => {
  const { fetcher, requests } = createFetcher({
    "GET https://api.example.com/v1/models": { status: 200, body: { data: [{ id: "m-1" }, { id: "m-2", name: "Model 2" }] } },
    "POST https://api.example.com/v1/chat/completions": { status: 200, body: chatSuccess },
    "POST https://api.example.com/v1/responses": { status: 400, body: { error: "bad param" } },
  });
  const result = await probeProvider({ baseUrl: "https://api.example.com/", token: "sk", fetcher });
  expect(result.endpoints).toEqual([
    { protocol: "openai-chat", baseUrl: "https://api.example.com/v1" },
    { protocol: "openai-responses", baseUrl: "https://api.example.com/v1" },
  ]);
  expect(result.models).toEqual([
    { id: "m-1", name: "m-1" },
    { id: "m-2", name: "Model 2" },
  ]);
  const chat = requests.find((request) => request.url.endsWith("/chat/completions"));
  expect(chat?.body).toMatchObject({ model: "m-1", max_tokens: 1 });
  expect(chat?.headers.Authorization).toBe("Bearer sk");
});

test("probeProvider detects an Anthropic endpoint from a /v1 URL and sends Anthropic headers", async () => {
  const { fetcher, requests } = createFetcher({
    "GET https://anthropic.example.com/v1/models": { status: 401 },
    "POST https://anthropic.example.com/v1/messages": { status: 200, body: messagesSuccess },
    "POST https://anthropic.example.com/v1/responses": { status: 405 },
  });
  const result = await probeProvider({ baseUrl: "https://anthropic.example.com/v1", token: "key", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://anthropic.example.com" }]);
  expect(result.models).toEqual([]);
  const messages = requests.find((request) => request.url.endsWith("/v1/messages"));
  expect(messages?.headers["x-api-key"]).toBe("key");
  expect(messages?.headers["anthropic-version"]).toBe("2023-06-01");
  expect(messages?.body).toMatchObject({ max_tokens: 1 });
  expect(requests.some((request) => request.url.endsWith("/chat/completions"))).toBe(false);
});

test("probeProvider keeps a non v1 version segment such as z.ai /v4", async () => {
  const { fetcher } = createFetcher({
    "GET https://api.z.ai/api/paas/v4/models": { status: 200, body: { data: [{ id: "glm-4.6" }] } },
    "POST https://api.z.ai/api/paas/v4/chat/completions": { status: 200, body: chatSuccess },
  });
  const result = await probeProvider({ baseUrl: "https://api.z.ai/api/paas/v4", token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://api.z.ai/api/paas/v4" }]);
});

test("probeProvider treats network errors and 5xx as unsupported without throwing per probe", async () => {
  const { fetcher } = createFetcher({
    "GET https://x.example.com/v1/models": { status: 200, body: [{ id: "a" }] },
    "POST https://x.example.com/v1/chat/completions": { status: 422, body: { detail: [{ msg: "field required" }] } },
    "POST https://x.example.com/v1/responses": "network-error",
    "POST https://x.example.com/v1/messages": { status: 503 },
  });
  const result = await probeProvider({ baseUrl: "https://x.example.com", token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://x.example.com/v1" }]);
});

test("probeProvider throws a key error when the key is rejected", async () => {
  const { fetcher } = createFetcher({
    "GET https://x.example.com/v1/models": { status: 401 },
    "POST https://x.example.com/v1/responses": { status: 401 },
    "POST https://x.example.com/v1/messages": { status: 403 },
  });
  const probe = probeProvider({ baseUrl: "https://x.example.com", token: "bad", fetcher });
  await expect(probe).rejects.toThrow(/rejected the API key/);
});

test("probeProvider throws when nothing answers", async () => {
  const { fetcher } = createFetcher({});
  await expect(probeProvider({ baseUrl: "https://nothing.example.com", token: "k", fetcher })).rejects.toThrow(
    /No OpenAI or Anthropic compatible API/,
  );
});

test("fetchProviderModels lists models per protocol", async () => {
  const { fetcher, requests } = createFetcher({
    "GET https://a.example.com/v1/models": { status: 200, body: { data: [{ id: "claude-x", display_name: "Claude X" }] } },
    "GET https://o.example.com/v1/models": { status: 200, body: { models: [{ id: "gpt-x" }] } },
  });
  expect(await fetchProviderModels({ protocol: "anthropic-messages", baseUrl: "https://a.example.com" }, "k", fetcher)).toEqual([
    { id: "claude-x", name: "Claude X" },
  ]);
  expect(await fetchProviderModels({ protocol: "openai-chat", baseUrl: "https://o.example.com/v1" }, "k", fetcher)).toEqual([
    { id: "gpt-x", name: "gpt-x" },
  ]);
  expect(requests[0]?.url).toBe("https://a.example.com/v1/models?limit=1000");
});

test("fetchProviderModels raises YoinkError on rejection or empty lists", async () => {
  const { fetcher } = createFetcher({
    "GET https://e.example.com/v1/models": { status: 200, body: { data: [] } },
  });
  const endpoint = { protocol: "openai-chat", baseUrl: "https://e.example.com/v1" } as const;
  await expect(fetchProviderModels(endpoint, "k", fetcher)).rejects.toThrow(YoinkError);
  await expect(fetchProviderModels({ ...endpoint, baseUrl: "https://missing.example.com/v1" }, "k", fetcher)).rejects.toThrow(
    /404/,
  );
});

test("fetchProviderModels resolves /models under an openai-chat base URL", async () => {
  const { fetcher, requests } = createFetcher({
    "GET https://openrouter.ai/api/v1/models": { status: 200, body: { data: [{ id: "a/b" }] } },
  });
  const endpoint = { protocol: "openai-chat", baseUrl: "https://openrouter.ai/api/v1" } as const;
  expect(await fetchProviderModels(endpoint, "k", fetcher)).toEqual([{ id: "a/b", name: "a/b" }]);
  expect(requests[0]?.url).toBe("https://openrouter.ai/api/v1/models");
});

test("probeProvider ignores HTTP 200 bodies that carry an error instead of a protocol response", async () => {
  const { fetcher } = createFetcher({
    "POST https://api.z.ai/api/anthropic/v1/messages": { status: 200, body: messagesSuccess },
    "POST https://api.z.ai/api/anthropic/v1/responses": { status: 200, body: { code: 500, msg: "404 NOT_FOUND" } },
  });
  const result = await probeProvider({ baseUrl: "https://api.z.ai/api/anthropic", token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://api.z.ai/api/anthropic" }]);
});

test("probeProvider rejects a bad key even when a route answers 200 with a wrapped 401", async () => {
  const { fetcher } = createFetcher({
    "POST https://api.z.ai/api/anthropic/v1/messages": { status: 401, body: { type: "error" } },
    "POST https://api.z.ai/api/anthropic/v1/responses": {
      status: 200,
      body: { code: 401, msg: "token expired or incorrect" },
    },
  });
  const probe = probeProvider({ baseUrl: "https://api.z.ai/api/anthropic", token: "bad", fetcher });
  await expect(probe).rejects.toThrow(/rejected the API key/);
});

test("probeProvider treats a 200 models listing with a wrapped 401 as a key rejection", async () => {
  const { fetcher } = createFetcher({
    "GET https://w.example.com/v1/models": { status: 200, body: { code: 401, msg: "invalid api key" } },
  });
  await expect(probeProvider({ baseUrl: "https://w.example.com", token: "bad", fetcher })).rejects.toThrow(
    /rejected the API key/,
  );
});

test("probeProvider requires a protocol error envelope on 400 and treats key errors there as unauthorized", async () => {
  const { fetcher } = createFetcher({
    "GET https://g.example.com/v1/models": { status: 200, body: { data: [{ id: "chat-1" }] } },
    "POST https://g.example.com/v1/chat/completions": { status: 400, body: { error: { message: "API key not valid" } } },
    "POST https://g.example.com/v1/responses": { status: 400 },
  });
  await expect(probeProvider({ baseUrl: "https://g.example.com", token: "bad", fetcher })).rejects.toThrow(
    /rejected the API key/,
  );
});

test("probeProvider counts a model_not_found 404 as a supported route", async () => {
  const modelMissing = { error: { message: "The model `gpt-x` does not exist", code: "model_not_found" } };
  const { fetcher } = createFetcher({
    "GET https://api.openai.com/v1/models": { status: 200, body: { data: [{ id: "gpt-x" }] } },
    "POST https://api.openai.com/v1/chat/completions": { status: 404, body: modelMissing },
    "POST https://api.openai.com/v1/responses": { status: 404, body: modelMissing },
    "POST https://api.openai.com/v1/messages": {
      status: 404,
      body: { error: { message: "Invalid URL (POST /v1/messages)", type: "invalid_request_error", code: null } },
    },
  });
  const result = await probeProvider({ baseUrl: "https://api.openai.com/v1", token: "k", fetcher });
  expect(result.endpoints).toEqual([
    { protocol: "openai-chat", baseUrl: "https://api.openai.com/v1" },
    { protocol: "openai-responses", baseUrl: "https://api.openai.com/v1" },
  ]);
});

test("probeProvider counts an Anthropic not_found model error as a supported messages route", async () => {
  const { fetcher } = createFetcher({
    "POST https://a.example.com/v1/messages": {
      status: 404,
      body: { type: "error", error: { type: "not_found_error", message: "model: yoink-probe" } },
    },
  });
  const result = await probeProvider({ baseUrl: "https://a.example.com", token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://a.example.com" }]);
});

test("probeProvider skips non chat models when choosing the probe model", async () => {
  const { fetcher, requests } = createFetcher({
    "GET https://api.example.com/v1/models": {
      status: 200,
      body: { data: [{ id: "text-embedding-3-small" }, { id: "whisper-1" }, { id: "gpt-x" }] },
    },
    "POST https://api.example.com/v1/chat/completions": { status: 200, body: chatSuccess },
    "POST https://api.example.com/v1/responses": { status: 200, body: responsesSuccess },
  });
  const result = await probeProvider({ baseUrl: "https://api.example.com/v1", token: "k", fetcher });
  expect(result.endpoints.map((endpoint) => endpoint.protocol)).toEqual(["openai-chat", "openai-responses"]);
  const probedModels = requests
    .filter((request) => request.method === "POST")
    .map((request) => (request.body as { model: string }).model);
  expect(new Set(probedModels)).toEqual(new Set(["gpt-x"]));
});

test("probeProvider retries the next model when a 404 error body does not name the model", async () => {
  const missingFor = (model: string): Response =>
    new Response(JSON.stringify({ error: { message: `No endpoints found for ${model}.` } }), { status: 404 });
  const { fetcher, requests } = createFetcher({
    "GET https://r.example.com/v1/models": { status: 200, body: { data: [{ id: "a/one" }, { id: "b/two" }] } },
  });
  const routedFetcher: Fetcher = async (input, init) => {
    const response = await fetcher(input, init);
    if (init?.method !== "POST" || typeof init.body !== "string") return response;
    const { model } = JSON.parse(init.body) as { model: string };
    if (input.endsWith("/chat/completions") && model === "b/two") {
      return new Response(JSON.stringify(chatSuccess), { status: 200 });
    }
    return input.endsWith("/v1/messages") ? response : missingFor(model);
  };
  const result = await probeProvider({ baseUrl: "https://r.example.com", token: "k", fetcher: routedFetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://r.example.com/v1" }]);
  const responsesModels = requests
    .filter((request) => request.url.endsWith("/responses"))
    .map((request) => (request.body as { model: string }).model);
  expect(responsesModels).toEqual(["a/one", "b/two"]);
});

test("probeProvider keeps a Gemini style /v1beta/openai URL without appending /v1", async () => {
  const base = "https://generativelanguage.googleapis.com/v1beta/openai";
  const { fetcher, requests } = createFetcher({
    [`GET ${base}/models`]: { status: 200, body: { data: [{ id: "gemini-2.5-pro" }] } },
    [`POST ${base}/chat/completions`]: { status: 200, body: { choices: [] } },
  });
  const result = await probeProvider({ baseUrl: `${base}/`, token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: base }]);
  const openaiUrls = [`${base}/v1/models`, `${base}/v1/chat/completions`, `${base}/v1/responses`];
  expect(requests.some((request) => openaiUrls.includes(request.url))).toBe(false);
});

test("probeProvider uses the raw URL when it answers and only falls back to /v1 when it does not", async () => {
  const gateway = "https://gateway.ai.cloudflare.com/v1/acc/gw/openai";
  const { fetcher } = createFetcher({
    [`GET ${gateway}/models`]: { status: 200, body: { data: [{ id: "gpt-x" }] } },
    [`POST ${gateway}/chat/completions`]: { status: 200, body: { choices: [] } },
    [`POST ${gateway}/v1/chat/completions`]: { status: 200, body: { choices: [] } },
  });
  const result = await probeProvider({ baseUrl: gateway, token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: gateway }]);
});

test("probeProvider tries raw and /v1 bases when no model listing answers", async () => {
  const { fetcher } = createFetcher({
    "POST https://api.perplexity.ai/responses": { status: 200, body: { object: "response" } },
  });
  const result = await probeProvider({ baseUrl: "https://api.perplexity.ai", token: "k", fetcher });
  expect(result.endpoints).toEqual([{ protocol: "openai-responses", baseUrl: "https://api.perplexity.ai" }]);
});

test("probeProvider normalizes a pasted full endpoint URL instead of doubling paths", async () => {
  const { fetcher, requests } = createFetcher({
    "GET https://api.example.com/v1/models": { status: 200, body: { data: [{ id: "m-1" }] } },
    "POST https://api.example.com/v1/chat/completions": { status: 200, body: { choices: [] } },
    "POST https://api.anthropic.example/v1/messages": { status: 200, body: { type: "message" } },
  });
  const openai = await probeProvider({ baseUrl: "https://api.example.com/v1/chat/completions?x=1", token: "k", fetcher });
  expect(openai.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://api.example.com/v1" }]);
  const anthropic = await probeProvider({ baseUrl: "https://api.anthropic.example/v1/messages", token: "k", fetcher });
  expect(anthropic.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://api.anthropic.example" }]);
  expect(requests.some((request) => /completions\/|messages\/v1/.test(request.url))).toBe(false);
});

test("fetchProviderModels lists OpenAI models at the stored base URL as is", async () => {
  const gateway = "https://gateway.ai.cloudflare.com/v1/acc/gw/openai";
  const { fetcher, requests } = createFetcher({
    [`GET ${gateway}/models`]: { status: 200, body: { data: [{ id: "gpt-x" }] } },
  });
  expect(await fetchProviderModels({ protocol: "openai-chat", baseUrl: gateway }, "k", fetcher)).toEqual([
    { id: "gpt-x", name: "gpt-x" },
  ]);
  expect(requests[0]?.url).toBe(`${gateway}/models`);
});
