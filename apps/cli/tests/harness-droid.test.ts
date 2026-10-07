import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createDroidAdapter } from "../src/features/harnesses/adapters/droid";
import { importDroidModels } from "../src/features/harnesses/adapters/droid-models";
import { hostSlug } from "../src/features/harnesses/endpoint";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import type { ModelInput, ModelSpec } from "../src/features/profiles/types";
import { MODEL_SPEC_DEFAULTS } from "../src/features/profiles/model-spec";
import {
  fileMode,
  kimiModel,
  makeProvider,
  makeTempDir,
  probesWith,
  readText,
  removeTempDir,
  visionModel,
} from "./support/provider-fixture";

type DroidEntry = Record<string, unknown>;

let root: string;
let dir: string;
let settingsPath: string;
let adapter: HarnessAdapter;

const userEntry: DroidEntry = {
  model: "accounts/fireworks/models/kimi-k2-instruct",
  displayName: "Kimi K2 [Fireworks]",
  baseUrl: "https://api.fireworks.ai/inference/v1",
  apiKey: "fw-test",
  provider: "generic-chat-completion-api",
  maxOutputTokens: 16384,
};

const commentedSettings = `{
  // Factory settings
  "model": "claude-sonnet-4-5",
  "reasoningEffort": "medium", // keep this
  "customModels": [
    /* my own models */
    ${JSON.stringify(userEntry)}
  ]
}
`;

const realisticSettings = {
  model: "custom:Kimi-K2-[Fireworks]-0",
  enableCompletionBell: false,
  customModels: [
    { ...userEntry, id: "custom:Kimi-K2-[Fireworks]-0", index: 0 },
    {
      model: "qwen3-coder:30b",
      displayName: "Qwen3 Coder [Ollama]",
      baseUrl: "http://localhost:11434/v1",
      apiKey: "not-needed",
      provider: "generic-chat-completion-api",
      maxOutputTokens: 8192,
    },
    {
      model: "claude-opus-x",
      displayName: "Claude Opus X",
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: "${ANTHROPIC_API_KEY}",
      provider: "anthropic",
      noImageSupport: false,
    },
    {
      model: "gpt-x",
      displayName: "GPT X [fuse]",
      baseUrl: "https://api.fuse.test/v1/",
      apiKey: "sk-fuse",
      provider: "openai",
      maxOutputTokens: 4096,
      noImageSupport: true,
    },
    { model: "broken", provider: "unknown", baseUrl: "https://x.test" },
  ],
};

const writeSettings = async (contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(settingsPath, contents);
};

const readSettings = async (): Promise<Record<string, unknown>> => parse(await readText(settingsPath));

const customModels = async (): Promise<DroidEntry[]> => (await readSettings()).customModels as DroidEntry[];

const expectedEntries = (overrides: DroidEntry = {}): DroidEntry[] => [
  {
    model: kimiModel.id,
    displayName: "Kimi K3 [fuse]",
    baseUrl: "https://api.fuse.test",
    apiKey: "sk-test-fuse",
    provider: "anthropic",
    maxOutputTokens: kimiModel.maxOutput,
    noImageSupport: true,
    ...overrides,
  },
  {
    model: visionModel.id,
    displayName: "GLM 5.2V [fuse]",
    baseUrl: "https://api.fuse.test",
    apiKey: "sk-test-fuse",
    provider: "anthropic",
    maxOutputTokens: visionModel.maxOutput,
    noImageSupport: false,
    ...overrides,
  },
];

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, ".factory");
  settingsPath = join(dir, "settings.json");
  adapter = createDroidAdapter({ configDir: dir }, probesWith([]));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates settings.json with mode 0600 and tagged anthropic entries", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(settingsPath)).toBe(0o600);
  expect(await readSettings()).toEqual({ customModels: expectedEntries() });
  expect(await adapter.isConnected("fuse")).toBe(true);
});

test("connect picks openai responses then generic chat completions by preference", async () => {
  await adapter.connect(
    makeProvider({
      endpoints: [
        { protocol: "openai-chat", baseUrl: "https://chat.test/v1" },
        { protocol: "openai-responses", baseUrl: "https://resp.test/v1/responses" },
      ],
    }),
    {},
  );
  expect(await customModels()).toEqual(expectedEntries({ provider: "openai", baseUrl: "https://resp.test/v1" }));
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "openai-chat", baseUrl: "https://chat.test/v1/" }] }), {});
  expect(await customModels()).toEqual(
    expectedEntries({ provider: "generic-chat-completion-api", baseUrl: "https://chat.test/v1" }),
  );
});

test("connect strips /v1 from an anthropic base url", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test/v1" }] }), {});
  expect((await customModels()).map((entry) => entry.baseUrl)).toEqual(["https://a.test", "https://a.test"]);
});

test("connect preserves comments, unrelated settings and user models", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), {});
  const text = await readText(settingsPath);
  for (const marker of ["// Factory settings", "// keep this", "/* my own models */"]) expect(text).toContain(marker);
  const settings = await readSettings();
  expect(settings.model).toBe("claude-sonnet-4-5");
  expect(settings.reasoningEffort).toBe("medium");
  expect(settings.customModels).toEqual([userEntry, ...expectedEntries()]);
  expect(await readText(`${settingsPath}.yoink.bak`)).toBe(commentedSettings);
});

test("connect overwrites the same id in place, keeps extra fields and drops stale models", async () => {
  const stale = { ...expectedEntries()[0], model: "old/model", displayName: "Old [fuse]" };
  const owned = { ...expectedEntries()[0], apiKey: "sk-old", id: "custom:Kimi-K3-[fuse]-1", extraArgs: { temperature: 0.6 } };
  await writeSettings(JSON.stringify({ customModels: [stale, userEntry, owned] }, null, 2));
  await adapter.connect(makeProvider(), {});
  const [kimi, vision] = expectedEntries();
  expect(await customModels()).toEqual([
    userEntry,
    { id: "custom:Kimi-K3-[fuse]-1", extraArgs: { temperature: 0.6 }, ...kimi },
    { ...vision },
  ]);
});

test("connect leaves entries owned by another provider id alone", async () => {
  const other = { ...expectedEntries()[0], displayName: "Kimi K3 [fuse-2]" };
  await writeSettings(JSON.stringify({ customModels: [other] }, null, 2));
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await customModels()).toEqual([other]);
  expect(await adapter.isConnected("fuse-2")).toBe(true);
});

test("connect never sets a default model and readDefaultModel stays null", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const settings = await readSettings();
  expect(settings.model).toBe("claude-sonnet-4-5");
  expect(settings.sessionDefaultSettings).toBeUndefined();
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
});

test("connect rejects a provider without a usable endpoint or models", async () => {
  await expect(adapter.connect(makeProvider({ endpoints: [] }), {})).rejects.toThrow("needs one of");
  await expect(adapter.connect(makeProvider({ models: [] }), {})).rejects.toThrow("no models");
  expect(await Bun.file(settingsPath).exists()).toBe(false);
});

test("disconnect removes only the tagged entries and keeps the user's default", async () => {
  await writeSettings(JSON.stringify(realisticSettings, null, 2));
  await adapter.disconnect("fuse");
  const settings = await readSettings();
  expect(settings.model).toBe("custom:Kimi-K2-[Fireworks]-0");
  expect(settings.customModels).toEqual(realisticSettings.customModels.filter((entry) => entry.model !== "gpt-x"));
  expect(await adapter.isConnected("fuse")).toBe(false);
});

test("connect then disconnect round-trips the original settings and comments", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await readSettings()).toEqual(parse(commentedSettings));
  const text = await readText(settingsPath);
  for (const marker of ["// Factory settings", "// keep this"]) expect(text).toContain(marker);
});

test("disconnect drops an emptied customModels key", async () => {
  await writeSettings('{\n  "model": "x"\n}\n');
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await readSettings()).toEqual({ model: "x" });
});

test("disconnect is a no-op when the file or entries are missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(settingsPath).exists()).toBe(false);
  await writeSettings(commentedSettings);
  await adapter.disconnect("fuse");
  expect(await readText(settingsPath)).toBe(commentedSettings);
  expect(await Bun.file(`${settingsPath}.yoink.bak`).exists()).toBe(false);
});

test("readProviders imports a realistic settings file faithfully", async () => {
  await writeSettings(JSON.stringify(realisticSettings, null, 2));
  const spec = (id: string, name: string, maxOutput: number, input: ModelInput[]): ModelSpec => ({
    id,
    name,
    contextWindow: MODEL_SPEC_DEFAULTS.contextWindow,
    maxOutput,
    reasoning: false,
    input,
  });
  expect(await adapter.readProviders()).toEqual([
    {
      source: "droid",
      id: "fireworks",
      displayName: "Fireworks",
      token: "fw-test",
      endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fireworks.ai/inference/v1" }],
      models: [spec(userEntry.model as string, "Kimi K2", 16384, ["text"])],
    },
    {
      source: "droid",
      id: "ollama",
      displayName: "Ollama",
      token: "not-needed",
      endpoints: [{ protocol: "openai-chat", baseUrl: "http://localhost:11434/v1" }],
      models: [spec("qwen3-coder:30b", "Qwen3 Coder", 8192, ["text"])],
    },
    {
      source: "droid",
      id: "anthropic",
      displayName: "anthropic",
      token: null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.anthropic.com" }],
      models: [spec("claude-opus-x", "Claude Opus X", MODEL_SPEC_DEFAULTS.maxOutput, ["text", "image"])],
    },
    {
      source: "droid",
      id: "fuse",
      displayName: "fuse",
      token: "sk-fuse",
      endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" }],
      models: [spec("gpt-x", "GPT X", 4096, ["text"])],
    },
  ]);
});

test("readProviders round-trips what connect wrote", async () => {
  await adapter.connect(makeProvider(), {});
  const [imported] = await adapter.readProviders();
  expect(imported?.id).toBe("fuse");
  expect(imported?.token).toBe("sk-test-fuse");
  expect(imported?.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test" }]);
  expect(imported?.models.map((model) => [model.id, model.name, model.input])).toEqual([
    [kimiModel.id, kimiModel.name, ["text"]],
    [visionModel.id, visionModel.name, ["text", "image"]],
  ]);
});

test("readProviders returns an empty list when the file is missing and invalid jsonc raises", async () => {
  expect(await adapter.readProviders()).toEqual([]);
  await writeSettings("{ not json");
  await expect(adapter.readProviders()).rejects.toThrow();
});

test("detect covers the droid binary and the factory dir", async () => {
  expect(await adapter.detect()).toEqual({ installed: false, configPath: settingsPath });
  const withBinary = createDroidAdapter({ configDir: dir }, probesWith(["droid"]));
  expect((await withBinary.detect()).installed).toBe(true);
  const withDir = createDroidAdapter({ configDir: dir }, probesWith([], [dir]));
  expect((await withDir.detect()).installed).toBe(true);
});

test("droid is a stable, non exclusive adapter without a connect notice", () => {
  expect(adapter.experimental).toBe(false);
  expect(adapter.exclusive).toBe(false);
  expect(adapter.label).toBe("Droid");
  expect(adapter.protocols).toEqual(["anthropic-messages", "openai-responses", "openai-chat"]);
  expect(adapter.connectNotice).toBeUndefined();
  expect(adapter.setsDefaultModel).toBe(false);
});

test("untagged droid entries take the shared host slug as their provider id", () => {
  const baseUrl = "https://api.My_Host.example/v1";
  const [imported] = importDroidModels([{ model: "m1", baseUrl, provider: "anthropic", apiKey: "k" }]);
  expect(imported?.id).toBe(hostSlug(baseUrl));
  expect(imported?.id).toBe("my-host");
});
