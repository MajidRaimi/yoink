import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { createContinueAdapter } from "../src/features/harnesses/adapters/continue";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir, visionModel } from "./support/provider-fixture";

let root: string;
let dir: string;
let extensionsDir: string;
let adapter: HarnessAdapter;
let configPath: string;

const commentedConfig = `# my continue setup
name: My Config # personal
version: 1.0.0
schema: v1
models:
  # local model
  - name: Llama Local
    provider: ollama
    model: llama3.1:8b
  - name: Claude Sonnet
    provider: anthropic
    model: claude-sonnet-4-5
    apiKey: sk-ant-real
    roles:
      - chat
context:
  - provider: code
`;

type ModelEntry = Record<string, unknown>;

const writeConfig = async (contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(configPath, contents);
};

const readConfig = async (): Promise<Record<string, unknown>> => parse(await readText(configPath));

const readModels = async (): Promise<ModelEntry[]> => (await readConfig()).models as ModelEntry[];

const modelNames = async (): Promise<string[]> => (await readModels()).map((entry) => String(entry.name));

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, ".continue");
  extensionsDir = join(root, "extensions");
  configPath = join(dir, "config.yaml");
  adapter = createContinueAdapter({ configDir: dir, vscodeExtensionsDir: extensionsDir }, probesWith([]));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates config.yaml with mode 0600, header and openai entries", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(configPath)).toBe(0o600);
  const config = await readConfig();
  expect(config).toMatchObject({ name: "Local Config", version: "1.0.0", schema: "v1" });
  expect(await readModels()).toEqual([
    {
      name: "Kimi K3 (fuse)",
      provider: "openai",
      model: kimiModel.id,
      apiBase: "https://api.fuse.test/v1/",
      apiKey: "sk-test-fuse",
      roles: ["chat", "edit", "apply"],
      capabilities: ["tool_use"],
      defaultCompletionOptions: { contextLength: 1048576, maxTokens: 32768 },
    },
    {
      name: "GLM 5.2V (fuse)",
      provider: "openai",
      model: visionModel.id,
      apiBase: "https://api.fuse.test/v1/",
      apiKey: "sk-test-fuse",
      roles: ["chat", "edit", "apply"],
      capabilities: ["tool_use", "image_input"],
      defaultCompletionOptions: { contextLength: 262144, maxTokens: 16384 },
    },
  ]);
});

test("connect uses the anthropic provider with a /v1 base when only messages is offered", async () => {
  await adapter.connect(
    makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test" }] }),
    {},
  );
  expect((await readModels())[0]).toMatchObject({ provider: "anthropic", apiBase: "https://api.fuse.test/v1/" });
});

test("connect rejects a provider with only a responses endpoint", async () => {
  const provider = makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" }] });
  await expect(adapter.connect(provider, {})).rejects.toThrow("no endpoint Continue can use");
  expect(await Bun.file(configPath).exists()).toBe(false);
});

test("connect preserves comments and unrelated content and backs up the original", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), {});
  const text = await readText(configPath);
  expect(text).toContain("# my continue setup");
  expect(text).toContain("name: My Config # personal");
  expect(text).toContain("# local model");
  expect(await modelNames()).toEqual(["Llama Local", "Claude Sonnet", "Kimi K3 (fuse)", "GLM 5.2V (fuse)"]);
  expect((await readConfig()).context).toEqual([{ provider: "code" }]);
  expect(await readText(`${configPath}.yoink.bak`)).toBe(commentedConfig);
});

test("connect adds a models list to a config without one", async () => {
  await writeConfig("name: Bare\nversion: 1.0.0\nschema: v1\n");
  await adapter.connect(makeProvider(), {});
  expect((await readConfig()).name).toBe("Bare");
  expect(await modelNames()).toEqual(["Kimi K3 (fuse)", "GLM 5.2V (fuse)"]);
});

test("connect writes block style into an empty flow models list and disconnect restores it", async () => {
  const original = "name: Empty\nversion: 1.0.0\nschema: v1\nmodels: []\n";
  await writeConfig(original);
  await adapter.connect(makeProvider(), {});
  expect(await readText(configPath)).toContain("models:\n  - name: Kimi K3 (fuse)\n");
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(original);
});

test("connect overwrites the same id in place and keeps user extras on owned entries", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider({ token: "sk-first" }), {});
  const edited = (await readText(configPath)).replace(
    "  - name: Kimi K3 (fuse)\n",
    "  - name: Kimi K3 (fuse)\n    requestOptions:\n      timeout: 60\n",
  );
  await writeFile(configPath, edited);
  await adapter.connect(makeProvider({ models: [kimiModel] }), {});
  const text = await readText(configPath);
  expect(text).not.toContain("sk-first");
  expect(await modelNames()).toEqual(["Llama Local", "Claude Sonnet", "Kimi K3 (fuse)"]);
  expect((await readModels())[2]).toMatchObject({ apiKey: "sk-test-fuse", requestOptions: { timeout: 60 } });
});

test("connect with a default model moves that entry to the top and readDefaultModel reports it", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  expect(await modelNames()).toEqual(["GLM 5.2V (fuse)", "Llama Local", "Claude Sonnet", "Kimi K3 (fuse)"]);
  expect(await adapter.readDefaultModel("fuse")).toBe(visionModel.id);
  expect(await adapter.readDefaultModel("other")).toBeNull();
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect(await modelNames()).toEqual(["Kimi K3 (fuse)", "GLM 5.2V (fuse)", "Llama Local", "Claude Sonnet"]);
  expect(await adapter.readDefaultModel("fuse")).toBe(kimiModel.id);
});

test("readDefaultModel is null when another entry is first", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), {});
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
});

test("disconnect removes only owned entries, clearing the default, and round-trips the file", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider({ name: "other", provider: "Other", token: "sk-other" }), {});
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.isConnected("other")).toBe(true);
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
  expect(await modelNames()).toEqual(["Llama Local", "Claude Sonnet", "Kimi K3 (other)", "GLM 5.2V (other)"]);
  await adapter.disconnect("other");
  expect(await readText(configPath)).toBe(commentedConfig);
});

test("disconnect ignores a user entry with the suffix but an unsupported provider", async () => {
  const config = "models:\n  - name: Mine (fuse)\n    provider: ollama\n    model: llama3\n";
  await writeConfig(config);
  expect(await adapter.isConnected("fuse")).toBe(false);
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(config);
});

test("disconnect is a no-op when the file is missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(configPath).exists()).toBe(false);
});

test("readProviders imports owned and user entries from a realistic config", async () => {
  await writeConfig(`${commentedConfig.replace("context:\n  - provider: code\n", "")}  - name: GPT Router
    provider: openai
    model: gpt-5
    apiBase: https://router.example.com/v1/
    apiKey: \${{ secrets.ROUTER_KEY }}
    capabilities: [tool_use, image_input]
    defaultCompletionOptions:
      contextLength: 400000
      maxTokens: 64000
`);
  await adapter.connect(makeProvider(), {});
  const imported = await adapter.readProviders();
  expect(imported.map((provider) => [provider.id, provider.token, provider.endpoints])).toEqual([
    ["anthropic", "sk-ant-real", [{ protocol: "anthropic-messages", baseUrl: "https://api.anthropic.com" }]],
    ["router", null, [{ protocol: "openai-chat", baseUrl: "https://router.example.com/v1" }]],
    ["fuse", "sk-test-fuse", [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }]],
  ]);
  expect(imported[1]?.models).toEqual([
    { id: "gpt-5", name: "GPT Router", contextWindow: 400000, maxOutput: 64000, reasoning: false, input: ["text", "image"] },
  ]);
  expect(imported[2]?.models).toEqual([
    { ...kimiModel, reasoning: false },
    { ...visionModel, reasoning: false },
  ]);
});

test("readProviders returns an empty list when nothing exists", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("detect reports installed via config dir, cn binary or VS Code extension", async () => {
  const paths = { configDir: dir, vscodeExtensionsDir: extensionsDir };
  expect(await adapter.detect()).toEqual({ installed: false, configPath });
  expect((await createContinueAdapter(paths, probesWith(["cn"])).detect()).installed).toBe(true);
  expect((await createContinueAdapter(paths, probesWith([], [dir])).detect()).installed).toBe(true);
  await mkdir(join(extensionsDir, "continue.continue-1.2.3-linux-x64"), { recursive: true });
  expect((await adapter.detect()).installed).toBe(true);
});

test("Continue has no connect notice and is not experimental", () => {
  expect(adapter.connectNotice).toBeUndefined();
  expect(adapter.experimental).toBe(false);
  expect(adapter.exclusive).toBe(false);
});

const legacyConfig = `{
  // legacy setup
  "models": [
    { "title": "GPT Legacy", "provider": "openai", "model": "gpt-4o", "apiKey": "sk-legacy", "apiBase": "https://api.example.com/v1", "contextLength": 64000, "completionOptions": { "maxTokens": 4096 } },
    { "title": "Llama", "provider": "ollama", "model": "llama3.1:8b" }
  ],
  "slashCommands": [{ "name": "share" }],
}
`;

const writeLegacyConfig = async (): Promise<string> => {
  const legacyPath = join(dir, "config.json");
  await mkdir(dir, { recursive: true });
  await writeFile(legacyPath, legacyConfig);
  return legacyPath;
};

test("connect refuses to create config.yaml beside a legacy config.json", async () => {
  const legacyPath = await writeLegacyConfig();
  await expect(adapter.connect(makeProvider(), {})).rejects.toThrow(/legacy .*config\.json.*migrate/);
  expect(await Bun.file(configPath).exists()).toBe(false);
  expect(await readText(legacyPath)).toBe(legacyConfig);
});

test("connect writes config.yaml when it already exists beside a legacy config.json", async () => {
  await writeLegacyConfig();
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), {});
  expect((await modelNames()).length).toBeGreaterThan(2);
});

test("detect and readProviders use a legacy config.json when config.yaml is missing", async () => {
  const legacyPath = await writeLegacyConfig();
  expect(await adapter.detect()).toEqual({ installed: false, configPath: legacyPath });
  const imported = await adapter.readProviders();
  expect(imported).toHaveLength(1);
  expect(imported[0]?.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://api.example.com/v1" }]);
  expect(imported[0]?.models[0]).toMatchObject({ id: "gpt-4o", name: "GPT Legacy", contextWindow: 64000, maxOutput: 4096 });
  expect(imported[0]?.token).toBe("sk-legacy");
});
