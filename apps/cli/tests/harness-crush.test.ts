import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createCrushAdapter, crushPathsFor, defaultCrushPaths } from "../src/features/harnesses/adapters/crush";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { fileMode, kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir, visionModel } from "./support/provider-fixture";

type CrushConfig = {
  $schema?: string;
  options?: Record<string, unknown>;
  providers?: Record<string, Record<string, unknown>>;
  models?: Record<string, Record<string, unknown>>;
};

let root: string;
let dir: string;
let dataDir: string;
let adapter: HarnessAdapter;
let configPath: string;

const realisticConfig = {
  $schema: "https://charm.land/crush.json",
  options: { debug: false },
  providers: {
    fuse: {
      name: "Fuse",
      type: "openai-compat",
      base_url: "https://api.fuse.test/v1",
      api_key: "sk-test",
      extra_headers: { "X-Team": "core" },
      models: [
        {
          id: "moonshotai/Kimi-K3",
          name: "Kimi K3",
          cost_per_1m_in: 0.6,
          cost_per_1m_out: 2.5,
          cost_per_1m_in_cached: 0.15,
          cost_per_1m_out_cached: 0,
          context_window: 1048576,
          default_max_tokens: 32768,
          can_reason: true,
          supports_attachments: false,
          default_reasoning_effort: "medium",
        },
        { id: "zai-org/GLM-5.2", name: "GLM 5.2", context_window: 1048576, default_max_tokens: 32768 },
      ],
    },
    proxy: {
      name: "Claude Proxy",
      type: "anthropic",
      base_url: "https://proxy.test/v1",
      api_key: "$PROXY_KEY",
      models: [{ id: "claude-x", name: "Claude X", supports_attachments: true, can_reason: true }],
    },
    openai: { api_key: "$OPENAI_API_KEY" },
  },
  models: {
    large: { model: "claude-x", provider: "proxy" },
    small: { model: "zai-org/GLM-5.2", provider: "fuse" },
  },
};

const commentedConfig = `{
  // crush settings
  "$schema": "https://charm.land/crush.json",
  "options": { "debug": true }, // keep debugging
  "providers": {
    /* local models */
    "ollama": {
      "type": "openai-compat",
      "base_url": "http://localhost:11434/v1",
      "models": [{ "id": "qwen3" }],
    },
  },
}
`;

const writeConfig = async (contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(configPath, contents);
};

const readConfig = async (): Promise<CrushConfig> => parse(await readText(configPath));

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "crush");
  dataDir = join(root, "data", "crush");
  adapter = createCrushAdapter({ configDir: dir, dataDir }, probesWith([]));
  configPath = join(dir, "crush.json");
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates crush.json with mode 0600, schema and an openai-compat provider", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(configPath)).toBe(0o600);
  expect(await readConfig()).toEqual({
    $schema: "https://charm.land/crush.json",
    providers: {
      fuse: {
        name: "Fuse",
        type: "openai-compat",
        base_url: "https://api.fuse.test/v1",
        api_key: "sk-test-fuse",
        models: [
          {
            id: kimiModel.id,
            name: "Kimi K3",
            cost_per_1m_in: 0,
            cost_per_1m_out: 0,
            cost_per_1m_in_cached: 0,
            cost_per_1m_out_cached: 0,
            context_window: 1048576,
            default_max_tokens: 32768,
            can_reason: true,
            supports_attachments: false,
          },
          {
            id: visionModel.id,
            name: "GLM 5.2V",
            cost_per_1m_in: 0,
            cost_per_1m_out: 0,
            cost_per_1m_in_cached: 0,
            cost_per_1m_out_cached: 0,
            context_window: 262144,
            default_max_tokens: 16384,
            can_reason: false,
            supports_attachments: true,
          },
        ],
      },
    },
  });
});

test("connect uses the anthropic type without /v1 when chat is unavailable", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test/v1" }] }), {});
  const fuse = (await readConfig()).providers?.fuse;
  expect(fuse?.type).toBe("anthropic");
  expect(fuse?.base_url).toBe("https://a.test");
});

test("connect rejects a provider with only a responses endpoint", async () => {
  const provider = makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" }] });
  await expect(adapter.connect(provider, {})).rejects.toThrow("Crush");
  expect(await Bun.file(configPath).exists()).toBe(false);
});

test("connect preserves comments and other providers and sets models.large", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const text = await readText(configPath);
  for (const marker of ["// crush settings", "// keep debugging", "/* local models */"]) expect(text).toContain(marker);
  const config = await readConfig();
  expect(config.options).toEqual({ debug: true });
  expect(Object.keys(config.providers ?? {})).toEqual(["ollama", "fuse"]);
  expect(config.models?.large).toEqual({ model: kimiModel.id, provider: "fuse" });
  expect(await adapter.readDefaultModel("fuse")).toBe(kimiModel.id);
  expect(await readText(`${configPath}.yoink.bak`)).toBe(commentedConfig);
});

test("connect overwrites the same id and keeps unmanaged provider and model fields", async () => {
  await writeConfig(JSON.stringify(realisticConfig, null, 2));
  await adapter.connect(makeProvider(), {});
  const config = await readConfig();
  expect(config.providers?.proxy).toEqual(realisticConfig.providers.proxy);
  expect(config.providers?.openai).toEqual(realisticConfig.providers.openai);
  const fuse = config.providers?.fuse ?? {};
  expect(fuse.api_key).toBe("sk-test-fuse");
  expect(fuse.extra_headers).toEqual({ "X-Team": "core" });
  const models = fuse.models as Record<string, unknown>[];
  expect(models.map((model) => model.id)).toEqual([kimiModel.id, visionModel.id]);
  expect(models[0]?.default_reasoning_effort).toBe("medium");
  expect(models[0]?.cost_per_1m_in).toBe(0);
  expect(config.models).toEqual(realisticConfig.models);
});

test("default is set, read back, and cleared on disconnect", async () => {
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  expect(await adapter.readDefaultModel("fuse")).toBe(visionModel.id);
  expect(await adapter.readDefaultModel("proxy")).toBeNull();
  await adapter.disconnect("fuse");
  const config = await readConfig();
  expect(config.models?.large).toBeUndefined();
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
});

test("disconnect removes only the provider entry and selections pointing at it", async () => {
  await writeConfig(JSON.stringify(realisticConfig, null, 2));
  await adapter.disconnect("fuse");
  const config = await readConfig();
  expect(Object.keys(config.providers ?? {})).toEqual(["proxy", "openai"]);
  expect(config.models).toEqual({ large: { model: "claude-x", provider: "proxy" } });
  expect(config.options).toEqual({ debug: false });
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.isConnected("proxy")).toBe(true);
});

test("disconnect clears a stale selection even when the entry is already gone", async () => {
  const { fuse: _removed, ...others } = realisticConfig.providers;
  await writeConfig(JSON.stringify({ ...realisticConfig, providers: others }, null, 2));
  await adapter.disconnect("fuse");
  expect((await readConfig()).models).toEqual({ large: { model: "claude-x", provider: "proxy" } });
});

test("disconnect is a no-op when the file or entry is missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(configPath).exists()).toBe(false);
  await writeConfig(commentedConfig);
  await adapter.disconnect("fuse");
  expect(await readText(configPath)).toBe(commentedConfig);
  expect(await Bun.file(`${configPath}.yoink.bak`).exists()).toBe(false);
});

test("connect then disconnect round-trips the original commented config", async () => {
  await writeConfig(commentedConfig);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  const config = await readConfig();
  expect(config.providers).toEqual(parse(commentedConfig).providers);
  expect(config.options).toEqual({ debug: true });
  const text = await readText(configPath);
  for (const marker of ["// crush settings", "// keep debugging", "/* local models */"]) expect(text).toContain(marker);
});

test("readProviders imports a realistic config faithfully", async () => {
  await writeConfig(JSON.stringify(realisticConfig, null, 2));
  expect(await adapter.readProviders()).toEqual([
    {
      source: "crush",
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
      source: "crush",
      id: "proxy",
      displayName: "Claude Proxy",
      token: null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://proxy.test" }],
      models: [{ id: "claude-x", name: "Claude X", contextWindow: 128000, maxOutput: 32000, reasoning: true, input: ["text", "image"] }],
    },
  ]);
});

test("readProviders returns an empty list when the file is missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("invalid json raises a parse error", async () => {
  await writeConfig("{ \"providers\": ");
  await expect(adapter.readProviders()).rejects.toThrow("Could not parse");
});

test("connect seeds an empty crush.json with the schema", async () => {
  await writeConfig("");
  await adapter.connect(makeProvider(), {});
  const config = await readConfig();
  expect(config.$schema).toBe("https://charm.land/crush.json");
  expect(Object.keys(config.providers ?? {})).toEqual(["fuse"]);
});

test("connectNotice warns only when a crushrc exists beside crush.json", async () => {
  expect(adapter.connectNotice?.(makeProvider())).toBeUndefined();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "crushrc"), "provider list\n");
  const notice = adapter.connectNotice?.(makeProvider());
  expect(notice).toBe(`A crushrc file exists at ${join(dir, "crushrc")}. If Crush reads it instead of crush.json, add Fuse there too.`);
});

test("detect covers the binary and the config dir", async () => {
  expect(await adapter.detect()).toEqual({ installed: false, configPath });
  expect((await createCrushAdapter({ configDir: dir, dataDir }, probesWith(["crush"])).detect()).installed).toBe(true);
  expect((await createCrushAdapter({ configDir: dir, dataDir }, probesWith([], [dir])).detect()).installed).toBe(true);
});

test("adapter metadata matches the contract", () => {
  expect(adapter.label).toBe("Crush");
  expect(adapter.protocols).toEqual(["openai-chat", "anthropic-messages"]);
  expect(adapter.exclusive).toBe(false);
  expect(adapter.experimental).toBe(false);
});

const withEnv = (values: Record<string, string | undefined>, run: () => void): void => {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  const apply = (entries: Record<string, string | undefined>): void => {
    for (const [key, value] of Object.entries(entries)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  apply(values);
  try {
    run();
  } finally {
    apply(previous);
  }
};

test("default paths honour CRUSH_GLOBAL_CONFIG then XDG_CONFIG_HOME", () => {
  withEnv({ CRUSH_GLOBAL_CONFIG: "/tmp/crush-global", XDG_CONFIG_HOME: "/tmp/xdg" }, () => {
    expect(defaultCrushPaths().configDir).toBe("/tmp/crush-global");
  });
  withEnv({ CRUSH_GLOBAL_CONFIG: undefined, XDG_CONFIG_HOME: "/tmp/xdg" }, () => {
    expect(defaultCrushPaths().configDir).toBe(join("/tmp/xdg", "crush"));
  });
});

test("default model write keeps the user's tuning keys on models.large", async () => {
  await writeConfig(
    JSON.stringify({
      models: {
        large: { provider: "anthropic", model: "claude-sonnet-4-5", reasoning_effort: "high", max_tokens: 16000, think: true },
      },
    }),
  );
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect((await readConfig()).models?.large).toEqual({
    provider: "fuse",
    model: kimiModel.id,
    reasoning_effort: "high",
    max_tokens: 16000,
    think: true,
  });
});

test("default model write replaces a models.large that is not an object", async () => {
  await writeConfig(JSON.stringify({ models: { large: "broken" } }));
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect((await readConfig()).models?.large).toEqual({ model: kimiModel.id, provider: "fuse" });
});

const writeDataConfig = async (contents: string): Promise<void> => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, "crush.json"), contents);
};

test("connectNotice warns when the Crush data config picks another provider's model", async () => {
  const dataPath = join(dataDir, "crush.json");
  await writeDataConfig(JSON.stringify({ models: { large: { provider: "anthropic", model: "claude-sonnet-4-5" } } }));
  const before = await readText(dataPath);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  expect(adapter.connectNotice?.(makeProvider())).toBe(
    `Added Fuse to Crush, but ${dataPath} keeps the model chosen in the Crush UI (anthropic/claude-sonnet-4-5). Pick fuse/${kimiModel.id} in Crush (ctrl+m) to use it.`,
  );
  expect(await readText(dataPath)).toBe(before);
});

test("connectNotice stays quiet when the data config agrees or yoink set no default", async () => {
  await writeDataConfig(JSON.stringify({ models: { large: { provider: "anthropic", model: "claude-sonnet-4-5" } } }));
  await adapter.connect(makeProvider(), {});
  expect(adapter.connectNotice?.(makeProvider())).toBeUndefined();
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await writeDataConfig(JSON.stringify({ models: { large: { provider: "fuse", model: kimiModel.id } } }));
  expect(adapter.connectNotice?.(makeProvider())).toBeUndefined();
});

test("connectNotice joins the crushrc and data config warnings", async () => {
  await writeDataConfig(JSON.stringify({ models: { large: { provider: "anthropic", model: "claude-sonnet-4-5" } } }));
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await writeFile(join(dir, "crushrc"), "provider list\n");
  const notice = adapter.connectNotice?.(makeProvider()) ?? "";
  expect(notice.startsWith("A crushrc file exists")).toBe(true);
  expect(notice).toContain("Pick fuse/");
});

test("crushPathsFor resolves config and data dirs per platform", () => {
  const home = "/home/user";
  expect(crushPathsFor({ platform: "linux", home })).toEqual({
    configDir: join(home, ".config", "crush"),
    dataDir: join(home, ".local", "share", "crush"),
  });
  expect(crushPathsFor({ platform: "darwin", home, xdgConfigHome: "/xdg/config", xdgDataHome: "/xdg/data" })).toEqual({
    configDir: join("/xdg/config", "crush"),
    dataDir: join("/xdg/data", "crush"),
  });
  expect(crushPathsFor({ platform: "win32", home: "C:/Users/u", localAppData: "C:/Users/u/AppData/Local" })).toEqual({
    configDir: join("C:/Users/u/AppData/Local", "crush"),
    dataDir: join("C:/Users/u/AppData/Local", "crush"),
  });
  expect(crushPathsFor({ platform: "win32", home: "C:/Users/u" }).configDir).toBe(join("C:/Users/u", "AppData", "Local", "crush"));
  expect(
    crushPathsFor({ platform: "win32", home: "C:/Users/u", globalConfig: "/g/config", globalData: "/g/data", xdgConfigHome: "/xdg" }),
  ).toEqual({ configDir: "/g/config", dataDir: "/g/data" });
  expect(crushPathsFor({ platform: "win32", home: "C:/Users/u", xdgConfigHome: "/xdg" }).configDir).toBe(join("/xdg", "crush"));
});
