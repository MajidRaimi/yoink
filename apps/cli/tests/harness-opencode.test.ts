import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createOpencodeAdapter } from "../src/features/harnesses/adapters/opencode";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

let root: string;
let dir: string;
let adapter: HarnessAdapter;
let jsonPath: string;

const appBundle = "/Applications/OpenCode.app";

const realisticConfig = {
  $schema: "https://opencode.ai/config.json",
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
    anthropic: { options: { timeout: 60000 } },
  },
};

const commentedJsonc = `{
  // opencode settings
  "$schema": "https://opencode.ai/config.json",
  "theme": "tokyonight", // my theme
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

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "opencode");
  adapter = createOpencodeAdapter({ configDir: dir, appBundles: [appBundle] }, probesWith([]));
  jsonPath = join(dir, "opencode.json");
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates opencode.json with mode 0600, schema and provider block", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(jsonPath)).toBe(0o600);
  expect(await readJsonc(jsonPath)).toEqual({
    $schema: "https://opencode.ai/config.json",
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
});

test("connect uses the anthropic sdk with a /v1 base url when chat is unavailable", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test" }] }), {});
  const fuse = ((await readJsonc(jsonPath)).provider as Record<string, Record<string, unknown>>).fuse;
  expect(fuse?.npm).toBe("@ai-sdk/anthropic");
  expect(fuse?.options).toEqual({ baseURL: "https://a.test/v1", apiKey: "sk-test-fuse" });
});

test("connect preserves comments and other providers in jsonc", async () => {
  const jsoncPath = join(dir, "opencode.jsonc");
  await writeConfig(jsoncPath, commentedJsonc);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect(await Bun.file(jsonPath).exists()).toBe(false);
  const text = await readText(jsoncPath);
  for (const marker of ["// opencode settings", "// my theme", "/* local models */"]) expect(text).toContain(marker);
  const config = await readJsonc(jsoncPath);
  expect(config.theme).toBe("tokyonight");
  expect(config.model).toBe("fuse/moonshotai/Kimi-K3");
  expect(Object.keys(config.provider as object)).toEqual(["local", "fuse"]);
  expect(await readText(`${jsoncPath}.yoink.bak`)).toBe(commentedJsonc);
});

test("connect overwrites the same id and keeps unmanaged model options", async () => {
  await writeConfig(jsonPath, JSON.stringify(realisticConfig, null, 2));
  await adapter.connect(makeProvider(), {});
  const providers = (await readJsonc(jsonPath)).provider as Record<string, Record<string, unknown>>;
  expect(providers.claude).toEqual(realisticConfig.provider.claude);
  expect(providers.anthropic).toEqual(realisticConfig.provider.anthropic);
  const options = providers.fuse?.options as Record<string, unknown>;
  expect(options.apiKey).toBe("sk-test-fuse");
  const models = providers.fuse?.models as Record<string, Record<string, unknown>>;
  expect(Object.keys(models)).toEqual(["moonshotai/Kimi-K3", "zai-org/GLM-5.2V"]);
  expect(models["moonshotai/Kimi-K3"]?.options).toEqual({ temperature: 0.6 });
});

test("disconnect removes the entry and clears a default pointing at it", async () => {
  await writeConfig(jsonPath, JSON.stringify({ ...realisticConfig, model: "fuse/zai-org/GLM-5.2" }, null, 2));
  await adapter.disconnect("fuse");
  const config = await readJsonc(jsonPath);
  expect(config.model).toBeUndefined();
  expect(Object.keys(config.provider as object)).toEqual(["claude", "anthropic"]);
  expect(await adapter.isConnected("fuse")).toBe(false);
});

test("disconnect clears a small_model pointing at the removed provider", async () => {
  const config = { ...realisticConfig, model: "fuse/moonshotai/Kimi-K3", small_model: "fuse/zai-org/GLM-5.2" };
  await writeConfig(jsonPath, JSON.stringify(config, null, 2));
  await adapter.disconnect("fuse");
  const updated = await readJsonc(jsonPath);
  expect(updated.model).toBeUndefined();
  expect(updated.small_model).toBeUndefined();
  expect(Object.keys(updated.provider as object)).toEqual(["claude", "anthropic"]);
});

test("disconnect clears a stale small_model even when the entry is already gone", async () => {
  const { fuse: _removed, ...otherProviders } = realisticConfig.provider;
  const config = { ...realisticConfig, provider: otherProviders, small_model: "fuse/zai-org/GLM-5.2" };
  await writeConfig(jsonPath, JSON.stringify(config, null, 2));
  await adapter.disconnect("fuse");
  expect((await readJsonc(jsonPath)).small_model).toBeUndefined();
});

test("disconnect leaves a default pointing at another provider", async () => {
  const config = { ...realisticConfig, model: "claude/claude-x", small_model: "claude/claude-x" };
  await writeConfig(jsonPath, JSON.stringify(config, null, 2));
  await adapter.disconnect("fuse");
  const updated = await readJsonc(jsonPath);
  expect(updated.model).toBe("claude/claude-x");
  expect(updated.small_model).toBe("claude/claude-x");
});

test("disconnect is a no-op when the file or entry is missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(jsonPath).exists()).toBe(false);
  await writeConfig(jsonPath, commentedJsonc);
  await adapter.disconnect("fuse");
  expect(await readText(jsonPath)).toBe(commentedJsonc);
  expect(await Bun.file(`${jsonPath}.yoink.bak`).exists()).toBe(false);
});

test("connect then disconnect round-trips the original jsonc text", async () => {
  await writeConfig(jsonPath, commentedJsonc);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await readJsonc(jsonPath)).toEqual(parse(commentedJsonc));
  const text = await readText(jsonPath);
  for (const marker of ["// opencode settings", "// my theme", "/* local models */"]) expect(text).toContain(marker);
});

test("readProviders imports a realistic config faithfully", async () => {
  await writeConfig(jsonPath, JSON.stringify(realisticConfig, null, 2));
  expect(await adapter.readProviders()).toEqual([
    {
      source: "opencode",
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
      source: "opencode",
      id: "claude",
      displayName: "Claude Proxy",
      token: null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://proxy.test" }],
      models: [{ id: "claude-x", name: "Claude X", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text", "image"] }],
    },
  ]);
});

test("readProviders returns an empty list when the file is missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("invalid jsonc raises a parse error", async () => {
  await writeConfig(jsonPath, "{ \"provider\": ");
  await expect(adapter.readProviders()).rejects.toThrow("Could not parse");
});

test("connect seeds an empty opencode.json with the schema and provider block", async () => {
  await writeConfig(jsonPath, "");
  expect(await adapter.readProviders()).toEqual([]);
  await adapter.connect(makeProvider(), {});
  const config = await readJsonc(jsonPath);
  expect(config.$schema).toBe("https://opencode.ai/config.json");
  expect(Object.keys(config.provider as Record<string, unknown>)).toEqual(["fuse"]);
});

test("connect keeps the comments of a comment-only opencode.json", async () => {
  await writeConfig(jsonPath, "// my opencode config\n");
  expect(await adapter.readProviders()).toEqual([]);
  await adapter.connect(makeProvider(), {});
  const text = await readText(jsonPath);
  expect(text).toContain("// my opencode config");
  expect(Object.keys((await readJsonc(jsonPath)).provider as Record<string, unknown>)).toEqual(["fuse"]);
});

test("backup is taken once", async () => {
  await writeConfig(jsonPath, commentedJsonc);
  await adapter.connect(makeProvider(), {});
  await adapter.connect(makeProvider({ token: "sk-other" }), {});
  expect(await readText(`${jsonPath}.yoink.bak`)).toBe(commentedJsonc);
});

test("detect covers the binary, config dir, and desktop app bundle", async () => {
  expect((await adapter.detect()).installed).toBe(false);
  const paths = { configDir: dir, appBundles: [appBundle] };
  expect((await createOpencodeAdapter(paths, probesWith(["opencode"])).detect()).installed).toBe(true);
  expect((await createOpencodeAdapter(paths, probesWith([], [appBundle])).detect()).installed).toBe(true);
  expect((await createOpencodeAdapter(paths, probesWith([], [dir])).detect()).configPath).toBe(jsonPath);
});

test("connect writes a Gemini style baseURL as stored and readProviders returns it unchanged", async () => {
  const gemini = "https://generativelanguage.googleapis.com/v1beta/openai";
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "openai-chat", baseUrl: gemini }] }), {});
  const config = parse(await readText(jsonPath)) as { provider: Record<string, { options: { baseURL: string } }> };
  expect(config.provider.fuse?.options.baseURL).toBe(gemini);
  const imported = await adapter.readProviders();
  expect(imported.find((provider) => provider.id === "fuse")?.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: gemini }]);
});
