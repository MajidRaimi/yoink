import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPiAdapter } from "../src/features/harnesses/adapters/pi";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

let dir: string;
let adapter: HarnessAdapter;
let modelsPath: string;
let settingsPath: string;

const otherProvider = {
  name: "Other",
  baseUrl: "https://other.test/v1",
  api: "openai-responses",
  apiKey: "$OTHER_KEY",
  models: [{ id: "gpt-x", name: "GPT X", reasoning: false, input: ["text"], contextWindow: 200000, maxTokens: 8000 }],
};

const realisticModels = {
  providers: {
    fuse: {
      name: "Fuse",
      baseUrl: "https://api.fuse.test/v1/",
      api: "openai-completions",
      apiKey: "sk-test",
      models: [
        {
          id: "moonshotai/Kimi-K3",
          name: "Kimi K3",
          reasoning: true,
          input: ["text"],
          contextWindow: 1048576,
          maxTokens: 32768,
          compat: { supportsDeveloperRole: false },
        },
        { id: "bare-model" },
      ],
    },
    other: otherProvider,
  },
};

const realisticSettings = {
  theme: "dark",
  defaultProvider: "fuse",
  defaultModel: "fuse/moonshotai/Kimi-K3",
  modelThinkingLevels: { "fuse/moonshotai/Kimi-K3": "high" },
};

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
};

const readJson = async (path: string): Promise<Record<string, unknown>> => JSON.parse(await readText(path));

beforeEach(async () => {
  dir = join(await makeTempDir(), "agent");
  adapter = createPiAdapter({ agentDir: dir }, probesWith([]));
  modelsPath = join(dir, "models.json");
  settingsPath = join(dir, "settings.json");
});

afterEach(async () => {
  await removeTempDir(join(dir, ".."));
});

test("connect creates models.json with mode 0600 and the full provider entry", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(modelsPath)).toBe(0o600);
  const config = await readJson(modelsPath);
  expect(config).toEqual({
    providers: {
      fuse: {
        name: "Fuse",
        baseUrl: "https://api.fuse.test/v1",
        api: "openai-completions",
        apiKey: "sk-test-fuse",
        models: [
          { id: kimiModel.id, name: "Kimi K3", reasoning: true, input: ["text"], contextWindow: 1048576, maxTokens: 32768 },
          { id: "zai-org/GLM-5.2V", name: "GLM 5.2V", reasoning: false, input: ["text", "image"], contextWindow: 262144, maxTokens: 16384 },
        ],
      },
    },
  });
  expect(await Bun.file(settingsPath).exists()).toBe(false);
  expect((await readText(modelsPath)).endsWith("}\n")).toBe(true);
});

test("connect uses the anthropic endpoint without /v1 when it is the only option", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test/v1" }] }), {});
  const fuse = ((await readJson(modelsPath)).providers as Record<string, Record<string, unknown>>).fuse;
  expect(fuse?.api).toBe("anthropic-messages");
  expect(fuse?.baseUrl).toBe("https://a.test");
});

test("connect throws when no endpoint is compatible", async () => {
  await expect(adapter.connect(makeProvider({ endpoints: [] }), {})).rejects.toThrow("no endpoint");
});

test("connect overwrites the same id, keeps other providers, and preserves model extras", async () => {
  await writeJson(modelsPath, realisticModels);
  await adapter.connect(makeProvider(), {});
  const providers = (await readJson(modelsPath)).providers as Record<string, Record<string, unknown>>;
  expect(providers.other).toEqual(otherProvider);
  expect(providers.fuse?.apiKey).toBe("sk-test-fuse");
  const models = providers.fuse?.models as Record<string, unknown>[];
  expect(models.map((model) => model.id)).toEqual([kimiModel.id, "zai-org/GLM-5.2V"]);
  expect(models[0]?.compat).toEqual({ supportsDeveloperRole: false });
  expect(await readText(`${modelsPath}.yoink.bak`)).toBe(`${JSON.stringify(realisticModels, null, 2)}\n`);
});

test("connect keeps provider-level extras on an existing same-named entry", async () => {
  const fuse = { ...realisticModels.providers.fuse, headers: { "X-Org": "acme" }, authHeader: true, compat: { strict: true } };
  await writeJson(modelsPath, { providers: { ...realisticModels.providers, fuse } });
  await adapter.connect(makeProvider(), {});
  const providers = (await readJson(modelsPath)).providers as Record<string, Record<string, unknown>>;
  expect(providers.fuse).toMatchObject({
    name: "Fuse",
    apiKey: "sk-test-fuse",
    headers: { "X-Org": "acme" },
    authHeader: true,
    compat: { strict: true },
  });
});

test("connect with a default model sets defaultProvider and defaultModel and keeps other settings", async () => {
  await writeJson(settingsPath, { theme: "dark" });
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect(await readJson(settingsPath)).toEqual({
    theme: "dark",
    defaultProvider: "fuse",
    defaultModel: "fuse/moonshotai/Kimi-K3",
  });
});

test("disconnect removes the entry and clears a default pointing at it", async () => {
  await writeJson(modelsPath, realisticModels);
  await writeJson(settingsPath, realisticSettings);
  await adapter.disconnect("fuse");
  expect(await readJson(modelsPath)).toEqual({ providers: { other: otherProvider } });
  expect(await readJson(settingsPath)).toEqual({
    theme: "dark",
    modelThinkingLevels: { "fuse/moonshotai/Kimi-K3": "high" },
  });
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.isConnected("other")).toBe(true);
});

test("disconnect leaves a default pointing at another provider", async () => {
  await writeJson(modelsPath, realisticModels);
  const settings = { defaultProvider: "other", defaultModel: "other/gpt-x" };
  await writeJson(settingsPath, settings);
  await adapter.disconnect("fuse");
  expect(await readJson(settingsPath)).toEqual(settings);
});

test("disconnect is a no-op when files or entries are missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(modelsPath).exists()).toBe(false);
  await writeJson(modelsPath, { providers: { other: otherProvider } });
  const before = await readText(modelsPath);
  await adapter.disconnect("fuse");
  expect(await readText(modelsPath)).toBe(before);
  expect(await Bun.file(`${modelsPath}.yoink.bak`).exists()).toBe(false);
});

test("connect then disconnect round-trips unrelated content", async () => {
  const original = { providers: { other: otherProvider }, extra: { keep: true } };
  await writeJson(modelsPath, original);
  await writeJson(settingsPath, { theme: "light" });
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect(await adapter.isConnected("fuse")).toBe(true);
  await adapter.disconnect("fuse");
  expect(await readJson(modelsPath)).toEqual(original);
  expect(await readJson(settingsPath)).toEqual({ theme: "light" });
});

test("readProviders imports a realistic file and nulls env references", async () => {
  await writeJson(modelsPath, realisticModels);
  const imported = await adapter.readProviders();
  expect(imported).toEqual([
    {
      source: "pi",
      id: "fuse",
      displayName: "Fuse",
      token: "sk-test",
      endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }],
      models: [
        { ...kimiModel },
        { id: "bare-model", name: "bare-model", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text"] },
      ],
    },
    {
      source: "pi",
      id: "other",
      displayName: "Other",
      token: null,
      endpoints: [{ protocol: "openai-responses", baseUrl: "https://other.test/v1" }],
      models: [{ id: "gpt-x", name: "GPT X", contextWindow: 200000, maxOutput: 8000, reasoning: false, input: ["text"] }],
    },
  ]);
});

test("readProviders returns an empty list when the file is missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("backup is taken once before the first write to an existing file", async () => {
  await writeJson(modelsPath, realisticModels);
  await adapter.connect(makeProvider(), {});
  await adapter.connect(makeProvider({ token: "sk-second" }), {});
  expect(await readJson(`${modelsPath}.yoink.bak`)).toEqual(realisticModels);
  if (process.platform !== "win32") expect(await fileMode(`${modelsPath}.yoink.bak`)).toBe(0o600);
});

test("detect reports installed via binary or config dir", async () => {
  expect((await adapter.detect()).installed).toBe(false);
  expect((await createPiAdapter({ agentDir: dir }, probesWith(["pi"])).detect()).installed).toBe(true);
  const viaDir = await createPiAdapter({ agentDir: dir }, probesWith([], [dir])).detect();
  expect(viaDir).toEqual({ installed: true, configPath: modelsPath });
});

test("readDefaultModel reads qualified and provider-scoped defaults for the provider only", async () => {
  await writeJson(settingsPath, realisticSettings);
  expect(await adapter.readDefaultModel("fuse")).toBe("moonshotai/Kimi-K3");
  expect(await adapter.readDefaultModel("other")).toBeNull();
  await writeJson(settingsPath, { defaultProvider: "fuse", defaultModel: "bare-model" });
  expect(await adapter.readDefaultModel("fuse")).toBe("bare-model");
  expect(await adapter.readDefaultModel("other")).toBeNull();
});
