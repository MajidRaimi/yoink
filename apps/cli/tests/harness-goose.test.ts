import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { createGooseAdapter } from "../src/features/harnesses/adapters/goose";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

let root: string;
let dir: string;
let adapter: HarnessAdapter;
let configPath: string;
let secretsPath: string;
let providerPath: string;

const commentedConfig = `# goose config
GOOSE_PROVIDER: openai # main provider
GOOSE_MODEL: gpt-5
extensions:
  developer:
    enabled: true
`;

const keyringDisabledConfig = `# file secrets
GOOSE_DISABLE_KEYRING: true
`;

const commentedSecrets = `# goose secrets
OPENAI_API_KEY: sk-openai-keep
`;

const deepseekProvider = {
  name: "custom_deepseek",
  engine: "openai",
  display_name: "DeepSeek",
  description: "Custom DeepSeek provider",
  api_key_env: "CUSTOM_DEEPSEEK_API_KEY",
  base_url: "https://api.deepseek.com/v1/chat/completions",
  models: [{ name: "deepseek-chat", context_limit: 128000 }, { name: "deepseek-reasoner" }],
  headers: null,
  timeout_seconds: null,
  supports_streaming: true,
};

const claudeProxyProvider = {
  name: "custom_proxy",
  engine: "anthropic",
  display_name: "Proxy",
  api_key_env: "CUSTOM_PROXY_API_KEY",
  base_url: "https://proxy.test/v1",
  models: [{ name: "claude-x", context_limit: 200000 }],
};

const writeConfigFixture = async (path: string, contents: string): Promise<void> => {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, contents);
};

const readJson = async (path: string): Promise<Record<string, unknown>> => JSON.parse(await readText(path));

const readYaml = async (path: string): Promise<Record<string, unknown>> => parse(await readText(path));

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "goose");
  adapter = createGooseAdapter({ configDir: dir }, probesWith([]));
  configPath = join(dir, "config.yaml");
  secretsPath = join(dir, "secrets.yaml");
  providerPath = join(dir, "custom_providers", "custom_fuse.json");
});

afterEach(async () => {
  delete process.env.GOOSE_DISABLE_KEYRING;
  await removeTempDir(root);
});

test("connect creates the custom provider file 0600 with an env key reference and no literal key", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(providerPath)).toBe(0o600);
  const entry = await readJson(providerPath);
  expect(entry).toMatchObject({
    name: "custom_fuse",
    engine: "openai",
    display_name: "Fuse",
    api_key_env: "CUSTOM_FUSE_API_KEY",
    base_url: "https://api.fuse.test/v1/chat/completions",
    supports_streaming: true,
  });
  expect(entry.models).toEqual([
    { name: kimiModel.id, context_limit: kimiModel.contextWindow },
    { name: "zai-org/GLM-5.2V", context_limit: 262144 },
  ]);
  expect(await readText(providerPath)).not.toContain("sk-test-fuse");
  expect(await Bun.file(configPath).exists()).toBe(false);
  expect(await Bun.file(secretsPath).exists()).toBe(false);
  expect(await adapter.isConnected("fuse")).toBe(true);
});

test("connect uses the anthropic engine without /v1 when only anthropic messages is available", async () => {
  const provider = makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test/v1" }] });
  await adapter.connect(provider, {});
  expect(await readJson(providerPath)).toMatchObject({ engine: "anthropic", base_url: "https://api.fuse.test" });
});

test("connect rejects a provider with only an openai responses endpoint", async () => {
  const provider = makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" }] });
  await expect(adapter.connect(provider, {})).rejects.toThrow("Goose");
});

test("connect overwrites the same id and keeps extra fields on the existing file", async () => {
  await writeConfigFixture(providerPath, JSON.stringify({ name: "custom_fuse", engine: "anthropic", timeout_seconds: 90, base_url: "https://old.test" }));
  await adapter.connect(makeProvider(), {});
  await adapter.connect(makeProvider({ provider: "Fuse Two" }), {});
  const entry = await readJson(providerPath);
  expect(entry).toMatchObject({ engine: "openai", display_name: "Fuse Two", timeout_seconds: 90 });
  expect(entry.base_url).toBe("https://api.fuse.test/v1/chat/completions");
  expect(await Bun.file(`${providerPath}.yoink.bak`).exists()).toBe(false);
});

test("a hand-made custom provider file at the same path is owned by yoink and deleted on disconnect", async () => {
  await writeConfigFixture(providerPath, JSON.stringify({ name: "custom_fuse", engine: "openai", base_url: "https://hand.test" }));
  await adapter.connect(makeProvider(), {});
  expect(await Bun.file(`${providerPath}.yoink.bak`).exists()).toBe(false);
  await adapter.disconnect("fuse");
  expect(await Bun.file(providerPath).exists()).toBe(false);
});

test("disconnect removes a stale backup of the custom provider file", async () => {
  const backupPath = `${providerPath}.yoink.bak`;
  await writeConfigFixture(backupPath, JSON.stringify({ name: "custom_fuse" }));
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await Bun.file(providerPath).exists()).toBe(false);
  expect(await Bun.file(backupPath).exists()).toBe(false);
});

test("connect sets the default model and preserves comments in config.yaml", async () => {
  await writeConfigFixture(configPath, commentedConfig);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const text = await readText(configPath);
  expect(text).toContain("# goose config");
  expect(text).toContain("GOOSE_PROVIDER: custom_fuse # main provider");
  expect(text).toContain("developer:");
  expect(await readYaml(configPath)).toMatchObject({ GOOSE_PROVIDER: "custom_fuse", GOOSE_MODEL: kimiModel.id });
  expect(await adapter.readDefaultModel("fuse")).toBe(kimiModel.id);
  expect(await adapter.readDefaultModel("other")).toBeNull();
  expect(await fileMode(configPath)).toBe(0o600);
});

test("connect without a default model leaves config.yaml untouched", async () => {
  await writeConfigFixture(configPath, commentedConfig);
  await adapter.connect(makeProvider(), {});
  expect(await readText(configPath)).toBe(commentedConfig);
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
});

test("connect writes the key into secrets.yaml only when the keyring is disabled", async () => {
  await writeConfigFixture(configPath, keyringDisabledConfig);
  await writeConfigFixture(secretsPath, commentedSecrets);
  await adapter.connect(makeProvider({ token: "sk-first" }), {});
  await adapter.connect(makeProvider(), {});
  const text = await readText(secretsPath);
  expect(text).toContain("# goose secrets");
  expect(text).not.toContain("sk-first");
  expect(await readYaml(secretsPath)).toEqual({ OPENAI_API_KEY: "sk-openai-keep", CUSTOM_FUSE_API_KEY: "sk-test-fuse" });
  expect(await fileMode(secretsPath)).toBe(0o600);
});

test("connect creates secrets.yaml 0600 when the keyring is disabled with a string flag", async () => {
  await writeConfigFixture(configPath, "GOOSE_DISABLE_KEYRING: \"1\"\n");
  await adapter.connect(makeProvider(), {});
  expect(await readYaml(secretsPath)).toEqual({ CUSTOM_FUSE_API_KEY: "sk-test-fuse" });
  expect(await fileMode(secretsPath)).toBe(0o600);
});

test("connectNotice tells the user to export the variable unless the keyring is disabled", async () => {
  const notice = adapter.connectNotice?.(makeProvider());
  expect(notice).toContain("CUSTOM_FUSE_API_KEY");
  expect(notice).toContain("goose configure");
  expect(notice).not.toContain("sk-test-fuse");
  await writeConfigFixture(configPath, keyringDisabledConfig);
  expect(adapter.connectNotice?.(makeProvider())).toBeUndefined();
  await writeConfigFixture(configPath, "GOOSE_DISABLE_KEYRING: false\n");
  expect(adapter.connectNotice?.(makeProvider())).toContain("CUSTOM_FUSE_API_KEY");
});

test("connect writes the key into secrets.yaml when GOOSE_DISABLE_KEYRING is exported", async () => {
  process.env.GOOSE_DISABLE_KEYRING = "yes";
  await adapter.connect(makeProvider(), {});
  expect(await readYaml(secretsPath)).toEqual({ CUSTOM_FUSE_API_KEY: "sk-test-fuse" });
  expect(await fileMode(secretsPath)).toBe(0o600);
});

test("connectNotice is silent when GOOSE_DISABLE_KEYRING is exported without a config file", () => {
  process.env.GOOSE_DISABLE_KEYRING = "1";
  expect(adapter.connectNotice?.(makeProvider())).toBeUndefined();
  process.env.GOOSE_DISABLE_KEYRING = "0";
  expect(adapter.connectNotice?.(makeProvider())).toContain("CUSTOM_FUSE_API_KEY");
});

test("connect leaves secrets.yaml alone when GOOSE_DISABLE_KEYRING is falsy and config does not disable it", async () => {
  process.env.GOOSE_DISABLE_KEYRING = "false";
  await adapter.connect(makeProvider(), {});
  expect(await Bun.file(secretsPath).exists()).toBe(false);
});

test("disconnect removes only this provider's file, secret and default", async () => {
  await writeConfigFixture(configPath, `${keyringDisabledConfig}${commentedConfig.replace("# goose config\n", "")}`);
  await writeConfigFixture(secretsPath, commentedSecrets);
  await writeConfigFixture(join(dir, "custom_providers", "custom_deepseek.json"), JSON.stringify(deepseekProvider));
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await Bun.file(providerPath).exists()).toBe(false);
  expect(await Bun.file(join(dir, "custom_providers", "custom_deepseek.json")).exists()).toBe(true);
  expect(await readYaml(secretsPath)).toEqual({ OPENAI_API_KEY: "sk-openai-keep" });
  const config = await readYaml(configPath);
  expect(config.GOOSE_PROVIDER).toBeUndefined();
  expect(config.GOOSE_MODEL).toBeUndefined();
  expect(config.extensions).toEqual({ developer: { enabled: true } });
  expect(await adapter.isConnected("fuse")).toBe(false);
});

test("disconnect keeps a default that points at another provider", async () => {
  await writeConfigFixture(configPath, commentedConfig);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(commentedConfig);
});

test("disconnect is a no-op when nothing exists", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(dir).exists()).toBe(false);
});

test("readProviders imports custom providers with keys from secrets.yaml", async () => {
  await writeConfigFixture(join(dir, "custom_providers", "custom_deepseek.json"), JSON.stringify(deepseekProvider, null, 2));
  await writeConfigFixture(join(dir, "custom_providers", "custom_proxy.json"), JSON.stringify(claudeProxyProvider));
  await writeConfigFixture(join(dir, "custom_providers", "custom_broken.json"), JSON.stringify({ name: "custom_broken", engine: "ollama" }));
  await writeConfigFixture(secretsPath, "CUSTOM_DEEPSEEK_API_KEY: sk-deepseek\n");
  const providers = await adapter.readProviders();
  expect(providers).toHaveLength(2);
  expect(providers[0]).toMatchObject({
    source: "goose",
    id: "deepseek",
    displayName: "DeepSeek",
    token: "sk-deepseek",
    endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.deepseek.com/v1" }],
  });
  expect(providers[0]?.models.map((model) => [model.id, model.contextWindow])).toEqual([
    ["deepseek-chat", 128000],
    ["deepseek-reasoner", expect.any(Number)],
  ]);
  expect(providers[1]).toMatchObject({
    id: "proxy",
    token: null,
    endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://proxy.test" }],
  });
});

test("readProviders round-trips a connected provider", async () => {
  await adapter.connect(makeProvider(), {});
  const [imported] = await adapter.readProviders();
  expect(imported).toMatchObject({
    id: "fuse",
    displayName: "Fuse",
    token: null,
    endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }],
  });
  expect(imported?.models.map((model) => model.id)).toEqual([kimiModel.id, "zai-org/GLM-5.2V"]);
});

test("readProviders returns nothing when the directory is missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("detect finds the goose binary or the config dir", async () => {
  expect((await createGooseAdapter({ configDir: dir }, probesWith(["goose"])).detect()).installed).toBe(true);
  expect((await createGooseAdapter({ configDir: dir }, probesWith([], [dir])).detect()).installed).toBe(true);
  expect((await createGooseAdapter({ configDir: dir }, probesWith([], ["/Applications/Goose.app"])).detect()).installed).toBe(true);
  const missing = await adapter.detect();
  expect(missing).toEqual({ installed: false, configPath });
});

test("goose is experimental and non-exclusive", () => {
  expect(adapter.experimental).toBe(true);
  expect(adapter.exclusive).toBe(false);
  expect(adapter.protocols).toEqual(["openai-chat", "anthropic-messages"]);
});

test("providers whose names differ only in punctuation keep separate secrets", async () => {
  await writeConfigFixture(configPath, keyringDisabledConfig);
  await adapter.connect(makeProvider({ name: "my-api", token: "sk-dash" }), {});
  await adapter.connect(makeProvider({ name: "my_api", token: "sk-under" }), {});
  const secrets = await readYaml(secretsPath);
  expect(secrets).toMatchObject({ CUSTOM_MY_API_API_KEY: "sk-dash" });
  expect(Object.values(secrets ?? {}).sort()).toEqual(["sk-dash", "sk-under"]);
  await adapter.disconnect("my-api");
  expect(Object.values((await readYaml(secretsPath)) ?? {})).toEqual(["sk-under"]);
});
