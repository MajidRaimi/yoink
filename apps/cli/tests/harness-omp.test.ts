import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { createOmpAdapter } from "../src/features/harnesses/adapters/omp";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

let root: string;
let dir: string;
let adapter: HarnessAdapter;
let modelsPath: string;
let configPath: string;

const commentedModels = `# omp custom models
providers:
  # keep this local one
  local:
    name: Local # inline note
    baseUrl: http://localhost:11434/v1
    api: openai-completions
    apiKey: OLLAMA_KEY
    models:
      - id: qwen3
        name: Qwen 3
`;

const commentedConfig = `# omp config
theme: dark
modelRoles:
  default: fuse/moonshotai/Kimi-K3 # main
  smol: local/qwen3
`;

const writeAgentFile = async (path: string, contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(path, contents);
};

const readYaml = async (path: string): Promise<Record<string, unknown>> => parse(await readText(path));

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "agent");
  adapter = createOmpAdapter({ agentDir: dir }, probesWith([]));
  modelsPath = join(dir, "models.yml");
  configPath = join(dir, "config.yml");
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates models.yml with mode 0600 in pi schema", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(modelsPath)).toBe(0o600);
  const config = await readYaml(modelsPath);
  const fuse = (config.providers as Record<string, Record<string, unknown>>).fuse;
  expect(fuse).toMatchObject({ name: "Fuse", baseUrl: "https://api.fuse.test/v1", api: "openai-completions", apiKey: "sk-test-fuse" });
  expect(fuse?.models).toHaveLength(2);
  expect(await Bun.file(configPath).exists()).toBe(false);
});

test("connect preserves comments and other providers, and overwrites the same id", async () => {
  await writeAgentFile(modelsPath, commentedModels);
  await adapter.connect(makeProvider({ token: "sk-first" }), {});
  await adapter.connect(makeProvider(), {});
  const text = await readText(modelsPath);
  expect(text).toContain("# omp custom models");
  expect(text).toContain("# keep this local one");
  expect(text).toContain("name: Local # inline note");
  expect(text).not.toContain("sk-first");
  expect(text.match(/^ {2}fuse:/gm)).toHaveLength(1);
  expect(await readText(`${modelsPath}.yoink.bak`)).toBe(commentedModels);
});

test("connect keeps provider-level extras and comments on an existing same-named entry", async () => {
  await writeAgentFile(
    modelsPath,
    `providers:
  fuse:
    # hand tuned
    name: Old Fuse # renamed by yoink
    baseUrl: https://old.fuse.test/v1
    api: openai-completions
    apiKey: FUSE_KEY
    headers:
      X-Org: acme # org routing
    authHeader: true
    compat:
      supportsDeveloperRole: false
    models:
      - id: moonshotai/Kimi-K3
`,
  );
  await adapter.connect(makeProvider(), {});
  const text = await readText(modelsPath);
  expect(text).toContain("# hand tuned");
  expect(text).toContain("X-Org: acme # org routing");
  expect(text).toContain("name: Fuse # renamed by yoink");
  const fuse = ((await readYaml(modelsPath)).providers as Record<string, Record<string, unknown>>).fuse;
  expect(fuse).toMatchObject({
    name: "Fuse",
    baseUrl: "https://api.fuse.test/v1",
    apiKey: "sk-test-fuse",
    headers: { "X-Org": "acme" },
    authHeader: true,
    compat: { supportsDeveloperRole: false },
  });
  expect(fuse?.models).toHaveLength(2);
});

test("connect writes into an existing models.yaml instead of creating models.yml", async () => {
  const yamlPath = join(dir, "models.yaml");
  await writeAgentFile(yamlPath, commentedModels);
  await adapter.connect(makeProvider(), {});
  expect(await Bun.file(modelsPath).exists()).toBe(false);
  expect(await adapter.isConnected("fuse")).toBe(true);
  expect((await adapter.detect()).configPath).toBe(yamlPath);
});

test("connect with a default model sets modelRoles.default and keeps comments", async () => {
  await writeAgentFile(configPath, "# omp config\ntheme: dark\n");
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const text = await readText(configPath);
  expect(text).toContain("# omp config");
  expect(await readYaml(configPath)).toEqual({ theme: "dark", modelRoles: { default: "fuse/moonshotai/Kimi-K3" } });
});

test("disconnect removes the entry and clears only a default pointing at it", async () => {
  await writeAgentFile(modelsPath, commentedModels);
  await writeAgentFile(configPath, commentedConfig);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await readText(modelsPath)).toBe(commentedModels);
  const config = await readText(configPath);
  expect(config).toContain("# omp config");
  expect(await readYaml(configPath)).toEqual({ theme: "dark", modelRoles: { smol: "local/qwen3" } });
});

test("disconnect leaves a default pointing at another provider", async () => {
  await writeAgentFile(modelsPath, commentedModels);
  const config = "modelRoles:\n  default: local/qwen3\n";
  await writeAgentFile(configPath, config);
  await adapter.disconnect("local");
  expect(await readText(configPath)).toBe("modelRoles: {}\n");
  await writeAgentFile(configPath, config);
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(config);
});

test("disconnect is a no-op when files are missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(modelsPath).exists()).toBe(false);
  expect(await Bun.file(configPath).exists()).toBe(false);
});

test("connect then disconnect round-trips the original file", async () => {
  await writeAgentFile(modelsPath, commentedModels);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await readText(modelsPath)).toBe(commentedModels);
});

test("readProviders imports providers and treats env var names as references", async () => {
  await writeAgentFile(modelsPath, commentedModels);
  await adapter.connect(makeProvider(), {});
  const imported = await adapter.readProviders();
  expect(imported.map((provider) => [provider.id, provider.token])).toEqual([
    ["local", null],
    ["fuse", "sk-test-fuse"],
  ]);
  expect(imported[0]?.models).toEqual([
    { id: "qwen3", name: "Qwen 3", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text"] },
  ]);
  expect(imported[1]?.models[1]?.input).toEqual(["text", "image"]);
});

test("readProviders falls back to a legacy models.json", async () => {
  await writeAgentFile(
    join(dir, "models.json"),
    JSON.stringify({ providers: { old: { baseUrl: "https://old.test", api: "anthropic-messages", apiKey: "${OLD}" } } }),
  );
  expect(await adapter.readProviders()).toEqual([
    { source: "omp", id: "old", displayName: "old", token: null, endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://old.test" }], models: [] },
  ]);
  expect(await adapter.isConnected("old")).toBe(true);
});

test("connect with only a legacy models.json carries its providers into the new models.yml", async () => {
  const legacyPath = join(dir, "models.json");
  const legacy = JSON.stringify({ providers: { old: { baseUrl: "https://old.test", api: "anthropic-messages", apiKey: "OLD_KEY" } } });
  await writeAgentFile(legacyPath, legacy);
  await adapter.connect(makeProvider(), {});
  const providers = (await readYaml(modelsPath)).providers as Record<string, Record<string, unknown>>;
  expect(Object.keys(providers)).toEqual(["old", "fuse"]);
  expect(providers.old).toEqual({ baseUrl: "https://old.test", api: "anthropic-messages", apiKey: "OLD_KEY" });
  expect((await adapter.readProviders()).map((provider) => provider.id)).toEqual(["old", "fuse"]);
  expect(await adapter.isConnected("old")).toBe(true);
  expect(await readText(legacyPath)).toBe(legacy);
});

test("readProviders returns an empty list when nothing exists", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("detect reports installed via binary or config dir", async () => {
  expect((await adapter.detect()).installed).toBe(false);
  expect((await createOmpAdapter({ agentDir: dir }, probesWith(["omp"])).detect()).installed).toBe(true);
  expect((await createOmpAdapter({ agentDir: dir }, probesWith([], [dir])).detect()).installed).toBe(true);
});
