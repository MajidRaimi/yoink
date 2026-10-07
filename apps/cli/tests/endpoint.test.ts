import { expect, test } from "bun:test";
import {
  canonicalBaseUrl,
  normalizeEndpointUrl,
  openaiBaseCandidates,
  sdkBaseUrl,
  withoutV1,
  withV1,
} from "../src/features/harnesses/endpoint";

const GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai";
const CLOUDFLARE = "https://gateway.ai.cloudflare.com/v1/acc/gw/openai";
const PERPLEXITY = "https://api.perplexity.ai";

test("withV1 appends /v1 when no version segment is present", () => {
  expect(withV1("https://openrouter.ai/api")).toBe("https://openrouter.ai/api/v1");
  expect(withV1("https://openrouter.ai/api///")).toBe("https://openrouter.ai/api/v1");
});

test("withV1 keeps an existing /v1", () => {
  expect(withV1("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
});

test("withV1 leaves other version segments alone", () => {
  expect(withV1("https://api.z.ai/api/paas/v4")).toBe("https://api.z.ai/api/paas/v4");
  expect(withV1("https://example.com/v2/")).toBe("https://example.com/v2");
});

test("withV1 treats beta, alpha and /openai suffixed versions as already versioned", () => {
  expect(withV1(`${GEMINI}/`)).toBe(GEMINI);
  expect(withV1("https://example.com/v1beta")).toBe("https://example.com/v1beta");
  expect(withV1("https://example.com/v2alpha1")).toBe("https://example.com/v2alpha1");
});

test("withV1 does not mistake names starting with v for versions", () => {
  expect(withV1("https://example.com/vendor")).toBe("https://example.com/vendor/v1");
  expect(withV1("https://example.com/v1betamax")).toBe("https://example.com/v1betamax/v1");
});

test("withoutV1 strips only a trailing /v1", () => {
  expect(withoutV1("https://api.kimi.com/coding/v1/")).toBe("https://api.kimi.com/coding");
  expect(withoutV1("https://api.z.ai/api/anthropic")).toBe("https://api.z.ai/api/anthropic");
});

test("canonicalBaseUrl strips pasted operation paths, queries and fragments", () => {
  expect(canonicalBaseUrl("https://api.example.com/v1/chat/completions")).toBe("https://api.example.com/v1");
  expect(canonicalBaseUrl("https://api.example.com/v1/completions/")).toBe("https://api.example.com/v1");
  expect(canonicalBaseUrl("https://api.example.com/v1/responses")).toBe("https://api.example.com/v1");
  expect(canonicalBaseUrl("https://api.example.com/v1/models")).toBe("https://api.example.com/v1");
  expect(canonicalBaseUrl("https://host/v1?x=1#frag")).toBe("https://host/v1");
  expect(canonicalBaseUrl("  https://host/api/  ")).toBe("https://host/api");
  expect(canonicalBaseUrl("https://host")).toBe("https://host");
  expect(canonicalBaseUrl("not a url/")).toBe("not a url");
});

test("withV1 and withoutV1 never double a pasted endpoint path", () => {
  expect(withV1("https://api.example.com/v1/chat/completions")).toBe("https://api.example.com/v1");
  expect(withV1("https://host/v1?x=1")).toBe("https://host/v1");
  expect(withV1("https://api.example.com/chat/completions")).toBe("https://api.example.com/v1");
  expect(withoutV1("https://api.anthropic.com/v1/messages")).toBe("https://api.anthropic.com");
  expect(withoutV1("https://api.anthropic.com/v1/messages?beta=true")).toBe("https://api.anthropic.com");
});

test("normalizeEndpointUrl keeps OpenAI base URLs as given and strips /v1 for Anthropic", () => {
  expect(normalizeEndpointUrl("anthropic-messages", "https://openrouter.ai/api/v1")).toBe("https://openrouter.ai/api");
  expect(normalizeEndpointUrl("openai-chat", "https://openrouter.ai/api/v1/")).toBe("https://openrouter.ai/api/v1");
  expect(normalizeEndpointUrl("openai-chat", "https://api.z.ai/api/paas/v4")).toBe("https://api.z.ai/api/paas/v4");
  expect(normalizeEndpointUrl("openai-chat", `${GEMINI}/`)).toBe(GEMINI);
  expect(normalizeEndpointUrl("openai-chat", CLOUDFLARE)).toBe(CLOUDFLARE);
  expect(normalizeEndpointUrl("openai-responses", PERPLEXITY)).toBe(PERPLEXITY);
  expect(normalizeEndpointUrl("openai-chat", "https://api.example.com/v1/chat/completions")).toBe(
    "https://api.example.com/v1",
  );
});

test("normalizeEndpointUrl round trips an imported OpenAI URL unchanged", () => {
  for (const url of [GEMINI, CLOUDFLARE, PERPLEXITY, "https://api.fuse.test/v1"]) {
    expect(normalizeEndpointUrl("openai-chat", normalizeEndpointUrl("openai-chat", url))).toBe(url);
  }
});

test("sdkBaseUrl writes OpenAI URLs untouched and gives Anthropic SDKs a /v1 root", () => {
  expect(sdkBaseUrl({ protocol: "openai-chat", baseUrl: CLOUDFLARE })).toBe(CLOUDFLARE);
  expect(sdkBaseUrl({ protocol: "openai-responses", baseUrl: `${GEMINI}/` })).toBe(GEMINI);
  expect(sdkBaseUrl({ protocol: "anthropic-messages", baseUrl: "https://a.test" })).toBe("https://a.test/v1");
  expect(sdkBaseUrl({ protocol: "anthropic-messages", baseUrl: "https://a.test/v1/" })).toBe("https://a.test/v1");
});

test("openaiBaseCandidates tries the raw URL before the /v1 fallback", () => {
  expect(openaiBaseCandidates("https://openrouter.ai/api/")).toEqual(["https://openrouter.ai/api", "https://openrouter.ai/api/v1"]);
  expect(openaiBaseCandidates(CLOUDFLARE)).toEqual([CLOUDFLARE, `${CLOUDFLARE}/v1`]);
  expect(openaiBaseCandidates(GEMINI)).toEqual([GEMINI]);
  expect(openaiBaseCandidates("https://api.example.com/v1/chat/completions")).toEqual(["https://api.example.com/v1"]);
});
