import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createCodexAdapter } from "../src/features/harnesses/adapters/codex";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

let root: string;
let dir: string;
let adapter: HarnessAdapter;
let configPath: string;

const commentedConfig = `# codex settings
approval_policy = "on-request"
notify = [
  "notify-send",
  "codex",
]

# trusted projects
[projects."/home/me/work"]
trust_level = "trusted"

[model_providers.local] # ollama
name = "Local"
base_url = "http://localhost:11434/v1"
env_key = "LOCAL_KEY"
`;

const configWithFuse = `model = "zai-org/GLM-5.2"
model_provider = "fuse"

[model_providers.fuse]
name = "Fuse"
base_url = "https://api.fuse.test/v1/"
wire_api = "responses"
experimental_bearer_token = "sk-test"

[model_providers.fuse.http_headers]
X-Old = "1"

[model_providers.other]
name = "Other"
base_url = "https://other.test"
wire_api = "chat"
env_key = "OTHER_KEY"
`;

const writeConfig = async (contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(configPath, contents);
};

const readToml = async (): Promise<Record<string, unknown>> => Bun.TOML.parse(await readText(configPath)) as Record<string, unknown>;

const providersOf = (config: Record<string, unknown>): Record<string, Record<string, unknown>> =>
  config.model_providers as Record<string, Record<string, unknown>>;

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "codex");
  configPath = join(dir, "config.toml");
  adapter = createCodexAdapter({ codexHome: dir }, probesWith([]));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates config.toml with mode 0600 and a responses provider", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(configPath)).toBe(0o600);
  expect(await readText(configPath)).toBe(`[model_providers.fuse]
name = "Fuse"
base_url = "https://api.fuse.test/v1"
wire_api = "responses"
experimental_bearer_token = "sk-test-fuse"
`);
});

test("connect requires an openai-responses endpoint", async () => {
  const chatOnly = makeProvider({ endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }] });
  await expect(adapter.connect(chatOnly, {})).rejects.toThrow("no endpoint");
});

test("connect preserves comments, formatting, and other tables", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), {});
  const text = await readText(configPath);
  expect(text.startsWith(commentedConfig)).toBe(true);
  expect(providersOf(await readToml()).fuse?.experimental_bearer_token).toBe("sk-test-fuse");
  expect(await readText(`${configPath}.yoink.bak`)).toBe(commentedConfig);
});

test("connect overwrites the same id in place and drops its old subtables", async () => {
  await writeConfig(configWithFuse);
  await adapter.connect(makeProvider(), {});
  const config = await readToml();
  expect(providersOf(config).fuse).toEqual({
    name: "Fuse",
    base_url: "https://api.fuse.test/v1",
    wire_api: "responses",
    experimental_bearer_token: "sk-test-fuse",
  });
  expect(providersOf(config).other?.env_key).toBe("OTHER_KEY");
  expect(config.model).toBe("zai-org/GLM-5.2");
  expect((await readText(configPath)).indexOf("[model_providers.fuse]")).toBeLessThan(
    (await readText(configPath)).indexOf("[model_providers.other]"),
  );
});

test("connect with a default model writes top-level keys above the first table", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const text = await readText(configPath);
  const config = await readToml();
  expect(config.model).toBe(kimiModel.id);
  expect(config.model_provider).toBe("fuse");
  expect(config.approval_policy).toBe("on-request");
  expect(text.indexOf("model_provider = ")).toBeLessThan(text.indexOf("[projects."));
  expect(text).toContain("# trusted projects");
});

test("connect with a default model into a file that starts with a table", async () => {
  await writeConfig('[projects."/x"]\ntrust_level = "trusted"\n');
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const text = await readText(configPath);
  expect(text.startsWith(`model = "${kimiModel.id}"\nmodel_provider = "fuse"\n\n[projects."/x"]`)).toBe(true);
  expect((await readToml()).projects).toEqual({ "/x": { trust_level: "trusted" } });
});

test("disconnect removes the entry and clears the default when it points at the provider", async () => {
  await writeConfig(configWithFuse);
  await adapter.disconnect("fuse");
  const config = await readToml();
  expect(config.model).toBeUndefined();
  expect(config.model_provider).toBeUndefined();
  expect(Object.keys(providersOf(config))).toEqual(["other"]);
  expect(await adapter.isConnected("fuse")).toBe(false);
});

test("disconnect leaves the default when it points at another provider", async () => {
  await writeConfig(configWithFuse);
  await adapter.disconnect("other");
  const config = await readToml();
  expect(config.model_provider).toBe("fuse");
  expect(Object.keys(providersOf(config))).toEqual(["fuse"]);
});

test("disconnect is a no-op when the file or entry is missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(configPath).exists()).toBe(false);
  await writeConfig(commentedConfig);
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(commentedConfig);
  expect(await Bun.file(`${configPath}.yoink.bak`).exists()).toBe(false);
});

test("disconnect keeps comments that belong to the following table", async () => {
  await writeConfig(`${configWithFuse}\n# MCP servers below, keep tokens in sync!\n[mcp_servers.gh]\ncommand = "gh"\n`);
  await adapter.disconnect("fuse");
  const text = await readText(configPath);
  expect(text).toContain('env_key = "OTHER_KEY"\n\n# MCP servers below, keep tokens in sync!\n[mcp_servers.gh]');
  expect(text).not.toContain("model_providers.fuse");
});

test("connect then disconnect round-trips the original text", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(commentedConfig);
});

test("connect falls back to the patcher when the provider is an inline table", async () => {
  await writeConfig('approval_policy = "never"\nmodel_providers = { fuse = { name = "Old", base_url = "https://x.test/v1" } }\n');
  await adapter.connect(makeProvider(), {});
  const config = await readToml();
  expect(config.approval_policy).toBe("never");
  expect(providersOf(config).fuse?.experimental_bearer_token).toBe("sk-test-fuse");
});

test("readProviders imports providers, the default model, and nulls env-based keys", async () => {
  await writeConfig(configWithFuse);
  expect(await adapter.readProviders()).toEqual([
    {
      source: "codex",
      id: "fuse",
      displayName: "Fuse",
      token: "sk-test",
      endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" }],
      models: [{ id: "zai-org/GLM-5.2", name: "zai-org/GLM-5.2", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text"] }],
    },
    {
      source: "codex",
      id: "other",
      displayName: "Other",
      token: null,
      endpoints: [{ protocol: "openai-chat", baseUrl: "https://other.test" }],
      models: [],
    },
  ]);
});

test("readProviders returns an empty list when the file is missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("invalid toml raises a parse error", async () => {
  await writeConfig("model = \n");
  await expect(adapter.readProviders()).rejects.toThrow("Could not parse");
});

test("backup is taken once", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), {});
  await adapter.connect(makeProvider({ token: "sk-two" }), {});
  expect(await readText(`${configPath}.yoink.bak`)).toBe(commentedConfig);
});

test("detect reports installed via binary or codex home", async () => {
  expect((await adapter.detect()).installed).toBe(false);
  expect((await createCodexAdapter({ codexHome: dir }, probesWith(["codex"])).detect()).installed).toBe(true);
  expect(await createCodexAdapter({ codexHome: dir }, probesWith([], [dir])).detect()).toEqual({ installed: true, configPath });
});

test("connect writes an unversioned gateway base_url as stored and readProviders returns it unchanged", async () => {
  const gateway = "https://gateway.ai.cloudflare.com/v1/acc/gw/openai";
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: gateway }] }), {});
  expect(providersOf(await readToml()).fuse?.base_url).toBe(gateway);
  const [imported] = await adapter.readProviders();
  expect(imported?.endpoints).toEqual([{ protocol: "openai-responses", baseUrl: gateway }]);
});

test("connectNotice warns only when the provider is the default and a ChatGPT login exists", async () => {
  const provider = makeProvider();
  await adapter.connect(provider, {});
  await writeFile(join(dir, "auth.json"), JSON.stringify({ tokens: { id_token: "x" } }));
  expect(adapter.connectNotice?.(provider)).toBeUndefined();
  await adapter.connect(provider, { defaultModel: "m1" });
  const notice = adapter.connectNotice?.(provider);
  expect(notice).toContain(`model_provider = "${provider.name}"`);
  expect(notice).toContain(`yoink disconnect ${provider.name} --from codex`);
  await writeFile(join(dir, "auth.json"), JSON.stringify({ OPENAI_API_KEY: "sk-fake" }));
  expect(adapter.connectNotice?.(provider)).toBeUndefined();
});
