import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createKiloAdapter, defaultKiloPaths } from "../src/features/harnesses/adapters/kilo";
import { findAdapter } from "../src/features/harnesses/registry";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";
import { expectMode } from "./support/posix";

let root: string;
let dir: string;
let adapter: HarnessAdapter;
let jsonPath: string;
let jsoncPath: string;

const realisticConfig = {
  $schema: "https://app.kilo.ai/config.json",
  provider: {
    fuse: {
      npm: "@ai-sdk/openai-compatible",
      name: "Fuse",
      options: { baseURL: "https://api.fuse.test/v1", apiKey: "sk-test" },
      models: {
        "moonshotai/Kimi-K3": {
          name: "Kimi K3",
          tool_call: true,
          reasoning: true,
          limit: { context: 1048576, output: 32768 },
          options: { temperature: 0.6 },
        },
        "zai-org/GLM-5.2": { name: "GLM 5.2", tool_call: true, limit: { context: 1048576, output: 32768 } },
      },
    },
    claude: {
      npm: "@ai-sdk/anthropic",
      name: "Claude Proxy",
      options: { baseURL: "https://proxy.test/v1", apiKey: "{env:PROXY_KEY}" },
      models: { "claude-x": { name: "Claude X", modalities: { input: ["text", "image"], output: ["text"] } } },
    },
    responses: {
      npm: "@ai-sdk/openai",
      options: { baseURL: "https://responses.test/v1", apiKey: "sk-resp" },
      models: {},
    },
    anthropic: { options: { timeout: 60000 } },
  },
};

const commentedJsonc = `{
  // kilo settings
  "theme": "kilo-dark", // my theme
  "provider": {
    /* local models */
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "options": { "baseURL": "http://localhost:11434/v1" },
      "models": { "qwen3": {} },
    },
  },
}
`;

const writeConfig = async (path: string, contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(path, contents);
};

const readJsonc = async (path: string): Promise<Record<string, unknown>> => parse(await readText(path));

const providersIn = async (path: string): Promise<Record<string, Record<string, unknown>>> =>
  (await readJsonc(path)).provider as Record<string, Record<string, unknown>>;

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "kilo");
  adapter = createKiloAdapter({ configDir: dir }, probesWith([]));
  jsonPath = join(dir, "kilo.json");
  jsoncPath = join(dir, "kilo.jsonc");
});

afterEach(async () => {
  await removeTempDir(root);
});

test("adapter metadata matches the kilo target", () => {
  expect(adapter.id).toBe("kilo");
  expect(adapter.label).toBe("Kilo Code");
  expect(adapter.exclusive).toBe(false);
  expect(adapter.experimental).toBe(false);
  expect(adapter.protocols).toEqual(["openai-chat", "anthropic-messages", "openai-responses"]);
  expect(adapter.connectNotice).toBeUndefined();
});

test("registry exposes the kilo adapter", () => {
  expect(findAdapter("kilo")?.label).toBe("Kilo Code");
});

test("connect creates kilo.json with mode 0600 and the provider block", async () => {
  await adapter.connect(makeProvider(), {});
  await expectMode(jsonPath, 0o600);
  expect(await readJsonc(jsonPath)).toEqual({
    provider: {
      fuse: {
        npm: "@ai-sdk/openai-compatible",
        name: "Fuse",
        options: { baseURL: "https://api.fuse.test/v1", apiKey: "sk-test-fuse" },
        models: {
          "moonshotai/Kimi-K3": { name: "Kimi K3", tool_call: true, reasoning: true, limit: { context: 1048576, output: 32768 } },
          "zai-org/GLM-5.2V": {
            name: "GLM 5.2V",
            tool_call: true,
            reasoning: false,
            limit: { context: 262144, output: 16384 },
            modalities: { input: ["text", "image"], output: ["text"] },
          },
        },
      },
    },
  });
  expect(await readText(`${jsonPath}.yoink.bak`)).toBe("");
});

test("connect uses the anthropic sdk with a /v1 base url when chat is unavailable", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test" }] }), {});
  const fuse = (await providersIn(jsonPath)).fuse;
  expect(fuse?.npm).toBe("@ai-sdk/anthropic");
  expect(fuse?.options).toEqual({ baseURL: "https://a.test/v1", apiKey: "sk-test-fuse" });
});

test("connect uses the openai sdk for a responses-only provider", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://r.test/v1" }] }), {});
  expect((await providersIn(jsonPath)).fuse?.npm).toBe("@ai-sdk/openai");
});

test("connect rejects a provider without a usable endpoint", async () => {
  await expect(adapter.connect(makeProvider({ endpoints: [] }), {})).rejects.toThrow("Kilo Code");
  expect(await Bun.file(jsonPath).exists()).toBe(false);
});

test("connect preserves comments and other providers in kilo.jsonc", async () => {
  await writeConfig(jsoncPath, commentedJsonc);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect(await Bun.file(jsonPath).exists()).toBe(false);
  const text = await readText(jsoncPath);
  for (const marker of ["// kilo settings", "// my theme", "/* local models */"]) expect(text).toContain(marker);
  const config = await readJsonc(jsoncPath);
  expect(config.theme).toBe("kilo-dark");
  expect(config.model).toBe("fuse/moonshotai/Kimi-K3");
  expect(Object.keys(config.provider as object)).toEqual(["local", "fuse"]);
  expect(await readText(`${jsoncPath}.yoink.bak`)).toBe(commentedJsonc);
  await expectMode(jsoncPath, 0o600);
});

test("kilo.json wins over kilo.jsonc when both exist", async () => {
  await writeConfig(jsonPath, "{}\n");
  await writeConfig(jsoncPath, commentedJsonc);
  await adapter.connect(makeProvider(), {});
  expect(Object.keys(await providersIn(jsonPath))).toEqual(["fuse"]);
  expect(await readText(jsoncPath)).toBe(commentedJsonc);
});

test("connect overwrites the same id and keeps unmanaged content", async () => {
  await writeConfig(jsonPath, JSON.stringify(realisticConfig, null, 2));
  await adapter.connect(makeProvider(), {});
  const config = await readJsonc(jsonPath);
  expect(config.$schema).toBe(realisticConfig.$schema);
  const providers = config.provider as Record<string, Record<string, unknown>>;
  expect(Object.keys(providers)).toEqual(["fuse", "claude", "responses", "anthropic"]);
  expect(providers.claude).toEqual(realisticConfig.provider.claude);
  expect(providers.anthropic).toEqual(realisticConfig.provider.anthropic);
  expect((providers.fuse?.options as Record<string, unknown>).apiKey).toBe("sk-test-fuse");
  const models = providers.fuse?.models as Record<string, Record<string, unknown>>;
  expect(Object.keys(models)).toEqual(["moonshotai/Kimi-K3", "zai-org/GLM-5.2V"]);
  expect(models["moonshotai/Kimi-K3"]?.options).toEqual({ temperature: 0.6 });
});

test("default model is set, read back, and scoped to the provider", async () => {
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect((await readJsonc(jsonPath)).model).toBe("fuse/moonshotai/Kimi-K3");
  expect(await adapter.readDefaultModel("fuse")).toBe(kimiModel.id);
  expect(await adapter.readDefaultModel("claude")).toBeNull();
});

test("connect without a default keeps an existing default", async () => {
  await writeConfig(jsonPath, JSON.stringify({ ...realisticConfig, model: "claude/claude-x" }, null, 2));
  await adapter.connect(makeProvider(), {});
  expect((await readJsonc(jsonPath)).model).toBe("claude/claude-x");
});

test("disconnect removes the entry and clears defaults pointing at it", async () => {
  const config = { ...realisticConfig, model: "fuse/zai-org/GLM-5.2", small_model: "fuse/moonshotai/Kimi-K3" };
  await writeConfig(jsonPath, JSON.stringify(config, null, 2));
  await adapter.disconnect("fuse");
  const updated = await readJsonc(jsonPath);
  expect(updated.model).toBeUndefined();
  expect(updated.small_model).toBeUndefined();
  expect(updated.$schema).toBe(realisticConfig.$schema);
  expect(Object.keys(updated.provider as object)).toEqual(["claude", "responses", "anthropic"]);
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.isConnected("claude")).toBe(true);
});

test("disconnect leaves defaults pointing at another provider", async () => {
  const config = { ...realisticConfig, model: "claude/claude-x", small_model: "claude/claude-x" };
  await writeConfig(jsonPath, JSON.stringify(config, null, 2));
  await adapter.disconnect("fuse");
  const updated = await readJsonc(jsonPath);
  expect(updated.model).toBe("claude/claude-x");
  expect(updated.small_model).toBe("claude/claude-x");
});

test("disconnect does not clear a default for a provider sharing an id prefix", async () => {
  const config = { ...realisticConfig, model: "fuse-2/some-model" };
  await writeConfig(jsonPath, JSON.stringify(config, null, 2));
  await adapter.disconnect("fuse");
  expect((await readJsonc(jsonPath)).model).toBe("fuse-2/some-model");
});

test("disconnect is a no-op when the file or entry is missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(jsonPath).exists()).toBe(false);
  await writeConfig(jsonPath, commentedJsonc);
  await adapter.disconnect("fuse");
  expect(await readText(jsonPath)).toBe(commentedJsonc);
  expect(await Bun.file(`${jsonPath}.yoink.bak`).exists()).toBe(false);
});

test("connect then disconnect round-trips the original jsonc", async () => {
  await writeConfig(jsoncPath, commentedJsonc);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await readJsonc(jsoncPath)).toEqual(parse(commentedJsonc));
  const text = await readText(jsoncPath);
  for (const marker of ["// kilo settings", "// my theme", "/* local models */"]) expect(text).toContain(marker);
});

test("readProviders imports a realistic config faithfully", async () => {
  await writeConfig(jsonPath, JSON.stringify(realisticConfig, null, 2));
  expect(await adapter.readProviders()).toEqual([
    {
      source: "kilo",
      id: "fuse",
      displayName: "Fuse",
      token: "sk-test",
      endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }],
      models: [
        { ...kimiModel },
        { id: "zai-org/GLM-5.2", name: "GLM 5.2", contextWindow: 1048576, maxOutput: 32768, reasoning: false, input: ["text"] },
      ],
    },
    {
      source: "kilo",
      id: "claude",
      displayName: "Claude Proxy",
      token: null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://proxy.test" }],
      models: [{ id: "claude-x", name: "Claude X", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text", "image"] }],
    },
    {
      source: "kilo",
      id: "responses",
      displayName: "responses",
      token: "sk-resp",
      endpoints: [{ protocol: "openai-responses", baseUrl: "https://responses.test/v1" }],
      models: [],
    },
  ]);
});

test("readProviders reads kilo.jsonc and returns an empty list when nothing exists", async () => {
  expect(await adapter.readProviders()).toEqual([]);
  await writeConfig(jsoncPath, commentedJsonc);
  const [local] = await adapter.readProviders();
  expect(local?.id).toBe("local");
  expect(local?.token).toBeNull();
  expect(local?.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "http://localhost:11434/v1" }]);
});

test("invalid jsonc raises a parse error", async () => {
  await writeConfig(jsonPath, "{ \"provider\": ");
  await expect(adapter.readProviders()).rejects.toThrow("Could not parse");
});

test("connect seeds an empty kilo.json", async () => {
  await writeConfig(jsonPath, "");
  await adapter.connect(makeProvider(), {});
  expect(Object.keys(await providersIn(jsonPath))).toEqual(["fuse"]);
});

test("backup is taken once", async () => {
  await writeConfig(jsonPath, commentedJsonc);
  await adapter.connect(makeProvider(), {});
  await adapter.connect(makeProvider({ token: "sk-other" }), {});
  expect(await readText(`${jsonPath}.yoink.bak`)).toBe(commentedJsonc);
});

test("detect covers the kilo binary and the config dir", async () => {
  expect(await adapter.detect()).toEqual({ installed: false, configPath: jsonPath });
  expect((await createKiloAdapter({ configDir: dir }, probesWith(["kilo"])).detect()).installed).toBe(true);
  expect((await createKiloAdapter({ configDir: dir }, probesWith(["opencode"])).detect()).installed).toBe(false);
  expect((await createKiloAdapter({ configDir: dir }, probesWith([], [dir])).detect()).installed).toBe(true);
  await writeConfig(jsoncPath, "{}");
  expect((await adapter.detect()).configPath).toBe(jsoncPath);
});

test("default kilo paths follow XDG_CONFIG_HOME", () => {
  const previous = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = join(root, "xdg");
  try {
    expect(defaultKiloPaths().configDir).toBe(join(root, "xdg", "kilo"));
  } finally {
    if (previous === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = previous;
  }
});
