import { expect, test } from "bun:test";
import { filterUnmanaged, mergeImportedProviders, scanHarnesses } from "../src/features/harnesses/import";
import { probeConnection } from "../src/features/harnesses/sync";
import type { HarnessAdapter, ImportedProvider } from "../src/features/harnesses/types";
import { ConfigParseError } from "../src/shared/errors";
import type { ModelSpec, Profile } from "../src/features/profiles/types";

const model = (id: string): ModelSpec => ({
  id,
  name: id,
  contextWindow: 128000,
  maxOutput: 32000,
  reasoning: false,
  input: ["text"],
});

const fuseFrom = (source: ImportedProvider["source"], models: string[]): ImportedProvider => ({
  source,
  id: "fuse",
  displayName: "Fuse",
  token: "sk-test",
  endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.example/v1" }],
  models: models.map(model),
});

test("mergeImportedProviders merges the same provider found in several harnesses", () => {
  const merged = mergeImportedProviders([fuseFrom("pi", ["a", "b"]), fuseFrom("opencode", ["b", "c"])]);
  expect(merged).toHaveLength(1);
  expect(merged[0]?.sources).toEqual(["pi", "opencode"]);
  expect(merged[0]?.models.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
});

test("mergeImportedProviders skips env-referenced providers with no keyed match", () => {
  expect(mergeImportedProviders([{ ...fuseFrom("pi", ["a"]), token: null }])).toEqual([]);
});

test("mergeImportedProviders keeps providers with different keys apart", () => {
  const other = { ...fuseFrom("opencode", ["a"]), token: "sk-other" };
  expect(mergeImportedProviders([fuseFrom("pi", ["a"]), other])).toHaveLength(2);
});

test("filterUnmanaged drops candidates yoink already manages", () => {
  const candidates = mergeImportedProviders([fuseFrom("pi", ["a"])]);
  const managed: Profile = {
    type: "external",
    name: "fuse",
    provider: "Fuse",
    baseUrl: "https://api.fuse.example/v1",
    token: "sk-test",
    model: "a",
    updatedAt: "2026-10-07T00:00:00.000Z",
    endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.example/v1" }],
  };
  expect(filterUnmanaged(candidates, [managed])).toEqual([]);
  expect(filterUnmanaged(candidates, [])).toHaveLength(1);
});

test("mergeImportedProviders folds an env-referenced copy into the keyed provider with the same id and url", () => {
  const envCopy = { ...fuseFrom("pi", ["a", "z"]), token: null };
  const merged = mergeImportedProviders([envCopy, fuseFrom("opencode", ["a"])]);
  expect(merged).toHaveLength(1);
  expect(merged[0]?.sources).toEqual(["opencode"]);
  expect(merged[0]?.unkeyedSources).toEqual(["pi"]);
  expect(merged[0]?.models.map((entry) => entry.id)).toEqual(["a", "z"]);
});

test("mergeImportedProviders never records an env-referenced harness as a connection", () => {
  const envCopy = { ...fuseFrom("opencode", ["a"]), token: null };
  const merged = mergeImportedProviders([fuseFrom("pi", ["a"]), envCopy]);
  expect(merged[0]?.sources).toEqual(["pi"]);
  expect(merged[0]?.unkeyedSources).toEqual(["opencode"]);
});

test("mergeImportedProviders keeps explicit model metadata over another harness's defaults", () => {
  const detailed: ModelSpec = {
    id: "m1",
    name: "M1 Big",
    contextWindow: 1000000,
    maxOutput: 64000,
    reasoning: true,
    input: ["text", "image"],
  };
  const sparse = fuseFrom("pi", ["m1"]);
  const rich = { ...fuseFrom("opencode", []), models: [detailed] };
  expect(mergeImportedProviders([sparse, rich])[0]?.models).toEqual([detailed]);
  expect(mergeImportedProviders([rich, sparse])[0]?.models).toEqual([detailed]);
});

const fakeAdapter = (id: HarnessAdapter["id"], read: () => Promise<ImportedProvider[]>): HarnessAdapter => ({
  id,
  label: id,
  protocols: ["openai-chat"],
  exclusive: false,
  experimental: false,
  setsDefaultModel: true,
  detect: async () => ({ installed: true, configPath: `/tmp/${id}` }),
  readProviders: read,
  isConnected: async () => {
    throw new ConfigParseError(`/tmp/${id}`, new Error("bad json"));
  },
  readDefaultModel: async () => null,
  connect: async () => {},
  disconnect: async () => {},
});

test("scanHarnesses reports unreadable harness configs instead of hiding them", async () => {
  const broken = fakeAdapter("opencode", async () => {
    throw new ConfigParseError("/tmp/opencode", new Error("bad json"));
  });
  const healthy = fakeAdapter("pi", async () => [fuseFrom("pi", ["a"])]);
  const scan = await scanHarnesses([], [healthy, broken]);
  expect(scan.candidates).toHaveLength(1);
  expect(scan.failures).toEqual([
    { source: "opencode", label: "opencode", message: "Could not parse /tmp/opencode: bad json" },
  ]);
});

test("probeConnection surfaces a parse error rather than reporting disconnected", async () => {
  const probe = await probeConnection(fakeAdapter("omp", async () => []), "fuse");
  expect(probe).toEqual({ connected: false, error: "Could not parse /tmp/omp: bad json" });
});
