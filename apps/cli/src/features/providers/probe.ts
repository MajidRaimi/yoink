import { YoinkError } from "../../shared/errors";
import { canonicalBaseUrl, openaiBaseCandidates, withoutV1 } from "../harnesses/endpoint";
import type { Endpoint, Protocol } from "../profiles/types";
import { mergeModelLists, parseModelList } from "./model-list";
import { classifyListingFailure, classifyProbeResponse, type ProbeOutcome, type ProbeVerdict } from "./probe-classify";
import type { Fetcher, ProbeResult, ProviderModel } from "./types";

const PROBE_TIMEOUT_MS = 8000;
const LIST_TIMEOUT_MS = 15000;
const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_MODEL_PAGE_SIZE = 1000;
const PLACEHOLDER_MODEL = "yoink-probe";
const MAX_PROBE_MODELS = 3;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const NON_CHAT_MODEL = /embed|whisper|tts|dall-e|image|moderation|audio|rerank|transcribe/i;

type Headers = Record<string, string>;

type RouteOutcome = ProbeOutcome | "redirected";

type RouteVerdict = Omit<ProbeVerdict, "outcome"> & { outcome: RouteOutcome };

type ModelListing = {
  outcome: RouteOutcome;
  models: ProviderModel[];
};

type OpenaiListing = ModelListing & {
  bases: string[];
};

type EndpointProbe = {
  endpoint: Endpoint;
  url: string;
  headers: Headers;
  models: string[];
  body: (model: string) => Record<string, unknown>;
};

export type ProbeInput = {
  baseUrl: string;
  token: string;
  fetcher?: Fetcher;
};

const openaiHeaders = (token: string): Headers => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const anthropicHeaders = (token: string): Headers => ({
  "x-api-key": token,
  Authorization: `Bearer ${token}`,
  "anthropic-version": ANTHROPIC_VERSION,
  "Content-Type": "application/json",
});

type SendOutcome =
  | { kind: "response"; response: Response }
  | { kind: "unreachable" }
  | { kind: "cross-origin-redirect" };

const sameOrigin = (from: string, to: string): boolean => new URL(from).origin === new URL(to).origin;

const redirectTarget = (response: Response, url: string): string | null => {
  const location = response.headers.get("location");
  if (!location) return null;
  try {
    return new URL(location, url).toString();
  } catch {
    return null;
  }
};

const redirectInit = (status: number, init: RequestInit): RequestInit => {
  const method = (init.method ?? "GET").toUpperCase();
  const switchesToGet = status === 303 || ((status === 301 || status === 302) && method === "POST");
  return switchesToGet ? { ...init, method: "GET", body: undefined } : init;
};

const followSameOrigin = async (
  fetcher: Fetcher,
  url: string,
  init: RequestInit,
  hopsLeft: number,
): Promise<SendOutcome> => {
  const response = await fetcher(url, { ...init, redirect: "manual" });
  if (response.type === "opaqueredirect") return { kind: "cross-origin-redirect" };
  if (!REDIRECT_STATUSES.has(response.status)) return { kind: "response", response };
  const target = redirectTarget(response, url);
  if (!target || !sameOrigin(url, target)) return { kind: "cross-origin-redirect" };
  if (hopsLeft <= 0) return { kind: "unreachable" };
  return followSameOrigin(fetcher, target, redirectInit(response.status, init), hopsLeft - 1);
};

const send = async (fetcher: Fetcher, url: string, init: RequestInit, timeoutMs: number): Promise<SendOutcome> => {
  try {
    return await followSameOrigin(fetcher, url, { ...init, signal: AbortSignal.timeout(timeoutMs) }, MAX_REDIRECTS);
  } catch {
    return { kind: "unreachable" };
  }
};

const unansweredOutcome = (sent: Exclude<SendOutcome, { kind: "response" }>): RouteOutcome =>
  sent.kind === "cross-origin-redirect" ? "redirected" : "unsupported";

const strongestFailure = (outcomes: readonly RouteOutcome[]): RouteOutcome => {
  if (outcomes.includes("unauthorized")) return "unauthorized";
  return outcomes.includes("redirected") ? "redirected" : "unsupported";
};

const crossOriginRedirectMessage = (url: string): string =>
  `${url} redirected to a different host. yoink does not follow it so your API key is not sent there. Use the final base URL instead.`;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const modelsUrl = (endpoint: Endpoint): string =>
  endpoint.protocol === "anthropic-messages"
    ? `${withoutV1(endpoint.baseUrl)}/v1/models?limit=${ANTHROPIC_MODEL_PAGE_SIZE}`
    : `${canonicalBaseUrl(endpoint.baseUrl)}/models`;

const modelsHeaders = (protocol: Protocol, token: string): Headers =>
  protocol === "anthropic-messages" ? anthropicHeaders(token) : openaiHeaders(token);

const listModels = async (
  fetcher: Fetcher,
  endpoint: Endpoint,
  token: string,
  timeoutMs: number,
): Promise<ModelListing> => {
  const sent = await send(
    fetcher,
    modelsUrl(endpoint),
    { method: "GET", headers: modelsHeaders(endpoint.protocol, token) },
    timeoutMs,
  );
  if (sent.kind !== "response") return { outcome: unansweredOutcome(sent), models: [] };
  const { response } = sent;
  const body = await readJson(response);
  const models = response.ok ? parseModelList(body) : null;
  return models ? { outcome: "supported", models } : { outcome: classifyListingFailure(response.status, body), models: [] };
};

const chatProbe = (baseUrl: string, token: string, models: string[]): EndpointProbe => ({
  endpoint: { protocol: "openai-chat", baseUrl },
  url: `${baseUrl}/chat/completions`,
  headers: openaiHeaders(token),
  models,
  body: (model) => ({ model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
});

const responsesProbe = (baseUrl: string, token: string, models: string[]): EndpointProbe => ({
  endpoint: { protocol: "openai-responses", baseUrl },
  url: `${baseUrl}/responses`,
  headers: openaiHeaders(token),
  models,
  body: (model) => ({ model, max_output_tokens: 16, input: "ping" }),
});

const messagesProbe = (baseUrl: string, token: string, models: string[]): EndpointProbe => ({
  endpoint: { protocol: "anthropic-messages", baseUrl },
  url: `${baseUrl}/v1/messages`,
  headers: anthropicHeaders(token),
  models,
  body: (model) => ({ model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
});

const probeModelCandidates = (models: ProviderModel[]): string[] => {
  const ids = models.map((model) => model.id);
  const chatIds = ids.filter((id) => !NON_CHAT_MODEL.test(id));
  return (chatIds.length > 0 ? chatIds : ids).slice(0, MAX_PROBE_MODELS);
};

const endpointProbes = (
  rawUrl: string,
  openaiBases: readonly string[],
  token: string,
  candidates: string[],
): EndpointProbe[] => {
  const models = candidates.length > 0 ? candidates : [PLACEHOLDER_MODEL];
  const probes = [messagesProbe(withoutV1(rawUrl), token, models)];
  if (candidates.length > 0) probes.push(...openaiBases.map((base) => chatProbe(base, token, candidates)));
  probes.push(...openaiBases.map((base) => responsesProbe(base, token, models)));
  return probes;
};

const listOpenaiModels = async (fetcher: Fetcher, rawUrl: string, token: string): Promise<OpenaiListing> => {
  const outcomes: RouteOutcome[] = [];
  for (const baseUrl of openaiBaseCandidates(rawUrl)) {
    const listing = await listModels(fetcher, { protocol: "openai-chat", baseUrl }, token, PROBE_TIMEOUT_MS);
    if (listing.outcome === "supported") return { ...listing, bases: [baseUrl] };
    outcomes.push(listing.outcome);
  }
  return { outcome: strongestFailure(outcomes), models: [], bases: openaiBaseCandidates(rawUrl) };
};

const firstPerProtocol = (endpoints: readonly Endpoint[]): Endpoint[] =>
  endpoints.filter((endpoint, index) => endpoints.findIndex((other) => other.protocol === endpoint.protocol) === index);

const attemptProbe = async (fetcher: Fetcher, probe: EndpointProbe, model: string): Promise<RouteVerdict> => {
  const sent = await send(
    fetcher,
    probe.url,
    { method: "POST", headers: probe.headers, body: JSON.stringify(probe.body(model)) },
    PROBE_TIMEOUT_MS,
  );
  if (sent.kind !== "response") return { outcome: unansweredOutcome(sent), retryWithAnotherModel: false };
  return classifyProbeResponse(probe.endpoint.protocol, sent.response.status, await readJson(sent.response));
};

const runProbe = async (fetcher: Fetcher, probe: EndpointProbe, modelIndex = 0): Promise<RouteOutcome> => {
  const model = probe.models[modelIndex];
  if (model === undefined) return "unsupported";
  const verdict = await attemptProbe(fetcher, probe, model);
  return verdict.retryWithAnotherModel ? runProbe(fetcher, probe, modelIndex + 1) : verdict.outcome;
};

const assertUsable = (rawUrl: string, endpoints: Endpoint[], outcomes: RouteOutcome[]): void => {
  if (endpoints.length > 0) return;
  const failure = strongestFailure(outcomes);
  if (failure === "unauthorized") {
    throw new YoinkError(`The provider at ${rawUrl} rejected the API key (401/403). Check the key and try again.`);
  }
  if (failure === "redirected") throw new YoinkError(crossOriginRedirectMessage(rawUrl));
  throw new YoinkError(
    `No OpenAI or Anthropic compatible API answered at ${rawUrl}. Check the base URL and that the server is reachable.`,
  );
};

export const probeProvider = async ({ baseUrl, token, fetcher = fetch }: ProbeInput): Promise<ProbeResult> => {
  const [openaiListing, anthropicListing] = await Promise.all([
    listOpenaiModels(fetcher, baseUrl, token),
    listModels(fetcher, { protocol: "anthropic-messages", baseUrl: withoutV1(baseUrl) }, token, PROBE_TIMEOUT_MS),
  ]);
  const models = mergeModelLists(openaiListing.models, anthropicListing.models);
  const probes = endpointProbes(baseUrl, openaiListing.bases, token, probeModelCandidates(models));
  const outcomes = await Promise.all(probes.map((probe) => runProbe(fetcher, probe)));
  const endpoints = firstPerProtocol(
    probes.filter((_, index) => outcomes[index] === "supported").map((probe) => probe.endpoint),
  );
  assertUsable(baseUrl, endpoints, [openaiListing.outcome, anthropicListing.outcome, ...outcomes]);
  return { endpoints, models };
};

export const fetchProviderModels = async (
  endpoint: Endpoint,
  token: string,
  fetcher: Fetcher = fetch,
): Promise<ProviderModel[]> => {
  const url = modelsUrl(endpoint);
  const sent = await send(
    fetcher,
    url,
    { method: "GET", headers: modelsHeaders(endpoint.protocol, token) },
    LIST_TIMEOUT_MS,
  );
  if (sent.kind === "cross-origin-redirect") {
    throw new YoinkError(crossOriginRedirectMessage(url));
  }
  if (sent.kind === "unreachable") throw new YoinkError(`Could not reach ${url}. Check the base URL and your connection.`);
  const { response } = sent;
  if (!response.ok) {
    throw new YoinkError(
      `Provider rejected the request (${response.status} ${response.statusText}). Check the base URL and API key.`,
    );
  }
  const models = parseModelList(await readJson(response));
  if (!models || models.length === 0) throw new YoinkError("The provider returned no models.");
  return models;
};
