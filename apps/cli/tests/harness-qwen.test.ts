import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createQwenAdapter } from "../src/features/harnesses/adapters/qwen";
import { ownedEnvKey } from "../src/features/harnesses/adapters/qwen-schema";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import {
  kimiModel,
  makeProvider,
  makeTempDir,
  probesWith,
  readText,
  removeTempDir,
  visionModel,
} from "./support/provider-fixture";
import { expectMode } from "./support/posix";

let root: string;
let dir: string;
let settingsPath: string;
let adapter: HarnessAdapter;

type Settings = {
  env?: Record<string, string>;
  modelProviders?: Record<string, Array<Record<string, unknown>>>;
  model?: Record<string, unknown>;
  security?: { auth?: Record<string, unknown> };
  [key: string]: unknown;
};

const commentedSettings = `{
  // qwen settings
  "ui": { "theme": "GitHub" }, // keep theme
  "env": { "DASHSCOPE_API_KEY": "sk-dash" },
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3-coder-plus",
        "name": "Qwen3 Coder Plus",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "envKey": "DASHSCOPE_API_KEY",
        "generationConfig": { "contextWindowSize": 1000000 }
      }
    ]
  },
  "model": { "name": "qwen3-coder-plus", "maxSessionTurns": 50 },
  "security": { "auth": { "selectedType": "openai" } }
}
`;

const realisticSettings = {
  env: { DASHSCOPE_API_KEY: "sk-dash", YOINK_FUSE_API_KEY: "sk-fuse" },
  modelProviders: {
    openai: [
      {
        id: "qwen3-coder-plus",
        name: "Qwen3 Coder Plus",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        envKey: "DASHSCOPE_API_KEY",
        generationConfig: { contextWindowSize: 1000000, samplingParams: { max_tokens: 65536 } },
      },
      {
        id: "moonshotai/Kimi-K3",
        name: "Kimi K3",
        baseUrl: "https://api.fuse.test/v1",
        envKey: "YOINK_FUSE_API_KEY",
        wireApi: "chat-completions",
        generationConfig: { contextWindowSize: 1048576 },
      },
      { id: "gpt-x", baseUrl: "https://api.openai.com/v1", envKey: "OPENAI_API_KEY", wireApi: "responses" },
    ],
    anthropic: [{ id: "claude-x", name: "Claude X", baseUrl: "https://proxy.test/v1", envKey: "PROXY_API_KEY" }],
  },
};

const writeSettings = async (contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(settingsPath, contents);
};

const readSettings = async (): Promise<Settings> => parse(await readText(settingsPath));

const fuseKey = ownedEnvKey("fuse");

const otherModel = { ...kimiModel, id: "other/model", name: "Other" };

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, ".qwen");
  settingsPath = join(dir, "settings.json");
  adapter = createQwenAdapter({ configDir: dir }, probesWith([]));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates settings.json with mode 0600, env key and chat-completions entries", async () => {
  await adapter.connect(makeProvider(), {});
  await expectMode(settingsPath, 0o600);
  expect(await readSettings()).toEqual({
    modelProviders: {
      openai: [
        {
          id: kimiModel.id,
          name: kimiModel.name,
          baseUrl: "https://api.fuse.test/v1",
          envKey: "YOINK_FUSE_API_KEY",
          wireApi: "chat-completions",
          generationConfig: { contextWindowSize: kimiModel.contextWindow },
        },
        {
          id: visionModel.id,
          name: visionModel.name,
          baseUrl: "https://api.fuse.test/v1",
          envKey: "YOINK_FUSE_API_KEY",
          wireApi: "chat-completions",
          generationConfig: { contextWindowSize: visionModel.contextWindow },
        },
      ],
    },
    env: { YOINK_FUSE_API_KEY: "sk-test-fuse" },
  });
});

test("ownedEnvKey upper snakes lowercase dashed ids and fingerprints the rest", () => {
  expect(ownedEnvKey("fuse")).toBe("YOINK_FUSE_API_KEY");
  expect(ownedEnvKey("my-proxy-v2")).toBe("YOINK_MY_PROXY_V2_API_KEY");
  expect(ownedEnvKey("my-proxy.v2")).toMatch(/^YOINK_MY_PROXY_V2__H[0-9A-F]{8}_API_KEY$/);
});

test("ownedEnvKey never maps distinct provider ids to the same key", () => {
  const ids = ["my-api", "my_api", "my.api", "My-API", "my--api", "my-api-", "MY_API"];
  expect(new Set(ids.map(ownedEnvKey)).size).toBe(ids.length);
});

test("providers whose names differ only in punctuation keep separate entries and keys", async () => {
  const firstModel = { ...kimiModel, id: "m1", name: "M1" };
  const secondModel = { ...kimiModel, id: "m2", name: "M2" };
  await adapter.connect(makeProvider({ name: "my-api", token: "sk-dash", models: [firstModel] }), {});
  await adapter.connect(makeProvider({ name: "my_api", token: "sk-under", models: [secondModel] }), {});
  const both = await readSettings();
  expect(both.modelProviders?.openai?.map((entry) => entry.id)).toEqual(["m1", "m2"]);
  expect(Object.values(both.env ?? {}).sort()).toEqual(["sk-dash", "sk-under"]);
  await adapter.disconnect("my-api");
  const remaining = await readSettings();
  expect(remaining.modelProviders?.openai?.map((entry) => [entry.id, entry.envKey])).toEqual([
    ["m2", ownedEnvKey("my_api")],
  ]);
  expect(remaining.env).toEqual({ [ownedEnvKey("my_api")]: "sk-under" });
  expect(await adapter.isConnected("my-api")).toBe(false);
  expect(await adapter.isConnected("my_api")).toBe(true);
});

test("import groups a fingerprinted owned key under the readable provider id", async () => {
  await adapter.connect(makeProvider({ name: "my_api", models: [kimiModel] }), {});
  const imported = await adapter.readProviders();
  expect(imported?.map((provider) => provider.id)).toEqual(["my-api"]);
});

test("responses-only provider writes wireApi responses", async () => {
  await adapter.connect(
    makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1/responses" }] }),
    {},
  );
  const entries = (await readSettings()).modelProviders?.openai ?? [];
  expect(entries.map((entry) => entry.wireApi)).toEqual(["responses", "responses"]);
  expect(entries[0]?.baseUrl).toBe("https://api.fuse.test/v1");
});

test("anthropic-only provider writes to the anthropic array without /v1 and selects anthropic", async () => {
  await adapter.connect(
    makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test/v1" }] }),
    { defaultModel: kimiModel.id },
  );
  const settings = await readSettings();
  expect(settings.modelProviders?.openai).toBeUndefined();
  const entry = settings.modelProviders?.anthropic?.[0];
  expect(entry?.baseUrl).toBe("https://api.fuse.test");
  expect(entry?.wireApi).toBeUndefined();
  expect(settings.security?.auth?.selectedType).toBe("anthropic");
  expect(await adapter.readDefaultModel("fuse")).toBe(kimiModel.id);
});

test("connect preserves unrelated settings, entries and comments", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), {});
  const text = await readText(settingsPath);
  expect(text).toContain("// qwen settings");
  expect(text).toContain("// keep theme");
  const settings = await readSettings();
  expect(settings.ui).toEqual({ theme: "GitHub" });
  expect(settings.env).toEqual({ DASHSCOPE_API_KEY: "sk-dash", YOINK_FUSE_API_KEY: "sk-test-fuse" });
  expect(settings.modelProviders?.openai?.map((entry) => entry.id)).toEqual([
    "qwen3-coder-plus",
    kimiModel.id,
    visionModel.id,
  ]);
  expect(settings.model).toEqual({ name: "qwen3-coder-plus", maxSessionTurns: 50 });
});

test("reconnecting the same provider replaces its entries, drops stale ones and keeps extra fields", async () => {
  await adapter.connect(makeProvider(), {});
  const settings = await readSettings();
  const tuned = (settings.modelProviders?.openai ?? []).map((entry) =>
    entry.id === kimiModel.id ? { ...entry, generationConfig: { contextWindowSize: 1, timeout: 90000 } } : entry,
  );
  await writeSettings(JSON.stringify({ ...settings, modelProviders: { openai: tuned } }, null, 2));
  await adapter.connect(
    makeProvider({ token: "sk-rotated", models: [{ ...kimiModel, name: "Kimi K3 Max" }] }),
    {},
  );
  const updated = await readSettings();
  expect(updated.modelProviders?.openai).toEqual([
    {
      id: kimiModel.id,
      name: "Kimi K3 Max",
      baseUrl: "https://api.fuse.test/v1",
      envKey: fuseKey,
      wireApi: "chat-completions",
      generationConfig: { contextWindowSize: kimiModel.contextWindow, timeout: 90000 },
    },
  ]);
  expect(updated.env).toEqual({ [fuseKey]: "sk-rotated" });
});

test("switching protocol moves owned entries to the matching array", async () => {
  await adapter.connect(makeProvider(), {});
  await adapter.connect(
    makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test" }] }),
    {},
  );
  const settings = await readSettings();
  expect(settings.modelProviders?.openai).toBeUndefined();
  expect(settings.modelProviders?.anthropic?.map((entry) => entry.id)).toEqual([kimiModel.id, visionModel.id]);
});

test("a second provider sharing a model id is refused and leaves the first provider intact", async () => {
  await adapter.connect(makeProvider({ models: [kimiModel] }), {});
  const before = await readText(settingsPath);
  await expect(
    adapter.connect(makeProvider({ name: "fuse-2", token: "sk-two", models: [kimiModel] }), {}),
  ).rejects.toThrow(kimiModel.id);
  expect(await readText(settingsPath)).toBe(before);
  expect(await adapter.isConnected("fuse")).toBe(true);
  expect(await adapter.isConnected("fuse-2")).toBe(false);
});

test("a user entry with the same model id is refused and survives a later disconnect", async () => {
  const userEntry = { id: kimiModel.id, baseUrl: "https://mine.test/v1", envKey: "MINE_API_KEY", extra: true };
  await writeSettings(
    JSON.stringify({
      env: { MINE_API_KEY: "sk-mine" },
      modelProviders: { openai: [userEntry] },
      model: { name: kimiModel.id },
      security: { auth: { selectedType: "openai" } },
    }),
  );
  const before = await readText(settingsPath);
  await expect(adapter.connect(makeProvider({ models: [kimiModel] }), {})).rejects.toThrow(
    `modelProviders.openai entry "${kimiModel.id}"`,
  );
  expect(await readText(settingsPath)).toBe(before);
  await adapter.disconnect("fuse");
  const settings = await readSettings();
  expect(settings.modelProviders?.openai).toEqual([userEntry]);
  expect(settings.model).toEqual({ name: kimiModel.id });
  expect(settings.security?.auth?.selectedType).toBe("openai");
  expect(await adapter.isConnected("fuse")).toBe(false);
});

test("a user entry holding the same key is adopted on connect, as after import", async () => {
  const userEntry = { id: kimiModel.id, baseUrl: "https://api.fuse.test/v1", envKey: "MINE_API_KEY" };
  const unrelated = { id: "other", baseUrl: "https://api.fuse.test/v1", envKey: "MINE_API_KEY" };
  await writeSettings(
    JSON.stringify({ env: { MINE_API_KEY: "sk-test-fuse" }, modelProviders: { openai: [userEntry, unrelated] } }),
  );
  await adapter.connect(makeProvider({ models: [kimiModel] }), {});
  const settings = await readSettings();
  expect(settings.modelProviders?.openai?.map((entry) => [entry.id, entry.envKey])).toEqual([
    [kimiModel.id, fuseKey],
    ["other", "MINE_API_KEY"],
  ]);
  expect(settings.env).toEqual({ MINE_API_KEY: "sk-test-fuse", [fuseKey]: "sk-test-fuse" });
});

test("a same-id user entry in another protocol array does not block connecting", async () => {
  const userEntry = { id: kimiModel.id, baseUrl: "https://mine.test", envKey: "MINE_API_KEY" };
  await writeSettings(JSON.stringify({ modelProviders: { anthropic: [userEntry] } }));
  await adapter.connect(makeProvider({ models: [kimiModel] }), {});
  await adapter.disconnect("fuse");
  expect((await readSettings()).modelProviders).toEqual({ anthropic: [userEntry] });
});

test("reconnecting keeps owned entries in place between foreign entries", async () => {
  const before = { id: "before", baseUrl: "https://mine.test/v1", envKey: "MINE_API_KEY" };
  const after = { id: "after", baseUrl: "https://mine.test/v1", envKey: "MINE_API_KEY" };
  await writeSettings(JSON.stringify({ modelProviders: { openai: [before] } }));
  await adapter.connect(makeProvider({ models: [kimiModel] }), {});
  const settings = await readSettings();
  const entries = settings.modelProviders?.openai ?? [];
  await writeSettings(JSON.stringify({ ...settings, modelProviders: { openai: [...entries, after] } }));
  await adapter.connect(makeProvider({ models: [kimiModel, visionModel] }), {});
  expect((await readSettings()).modelProviders?.openai?.map((entry) => entry.id)).toEqual([
    "before",
    kimiModel.id,
    "after",
    visionModel.id,
  ]);
});

test("default model sets model.name and selectedType and is read back", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  const settings = await readSettings();
  expect(settings.model).toEqual({ name: visionModel.id, maxSessionTurns: 50 });
  expect(settings.security?.auth?.selectedType).toBe("openai");
  expect(await adapter.readDefaultModel("fuse")).toBe(visionModel.id);
  expect(await adapter.readDefaultModel("other")).toBeNull();
});

test("default model replaces a legacy string model value", async () => {
  await writeSettings(JSON.stringify({ model: "legacy", security: "x" }));
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  const settings = await readSettings();
  expect(settings.model).toEqual({ name: kimiModel.id });
  expect(settings.security).toEqual({ auth: { selectedType: "openai" } });
});

test("readDefaultModel ignores a default owned by someone else", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), {});
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
});

test("disconnect removes only owned entries and env key and clears a default pointing here", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.connect(makeProvider({ name: "fuse-2", token: "sk-two", models: [otherModel] }), {});
  await adapter.disconnect("fuse");
  const settings = await readSettings();
  expect(settings.env).toEqual({ DASHSCOPE_API_KEY: "sk-dash", YOINK_FUSE_2_API_KEY: "sk-two" });
  expect(settings.modelProviders?.openai?.map((entry) => [entry.id, entry.envKey])).toEqual([
    ["qwen3-coder-plus", "DASHSCOPE_API_KEY"],
    [otherModel.id, "YOINK_FUSE_2_API_KEY"],
  ]);
  expect(settings.model).toEqual({ maxSessionTurns: 50 });
  expect(settings.security?.auth?.selectedType).toBeUndefined();
  expect(await readText(settingsPath)).toContain("// keep theme");
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.isConnected("fuse-2")).toBe(true);
});

test("disconnect keeps a default that points at another provider", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  const settings = await readSettings();
  expect(settings.model).toEqual({ name: "qwen3-coder-plus", maxSessionTurns: 50 });
  expect(settings.security?.auth?.selectedType).toBe("openai");
  expect(settings.env).toEqual({ DASHSCOPE_API_KEY: "sk-dash" });
});

test("disconnect of the only provider leaves no empty containers", async () => {
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await readSettings()).toEqual({});
});

test("disconnect is a no-op when the file is missing or nothing is owned", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(settingsPath).exists()).toBe(false);
  await writeSettings(commentedSettings);
  await adapter.disconnect("fuse");
  expect(await readText(settingsPath)).toBe(commentedSettings);
});

test("isConnected reflects owned entries", async () => {
  expect(await adapter.isConnected("fuse")).toBe(false);
  await adapter.connect(makeProvider(), {});
  expect(await adapter.isConnected("fuse")).toBe(true);
});

test("readProviders imports grouped providers from a realistic settings file", async () => {
  await writeSettings(JSON.stringify(realisticSettings, null, 2));
  const providers = await adapter.readProviders();
  expect(providers.map((provider) => [provider.id, provider.token])).toEqual([
    ["dashscope", "sk-dash"],
    ["fuse", "sk-fuse"],
    ["openai", null],
    ["proxy", null],
  ]);
  const [dashscope, fuse, openai, proxy] = providers;
  expect(dashscope?.source).toBe("qwen");
  expect(dashscope?.endpoints).toEqual([
    { protocol: "openai-chat", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  ]);
  expect(dashscope?.models[0]).toMatchObject({ id: "qwen3-coder-plus", contextWindow: 1000000, maxOutput: 65536 });
  expect(fuse?.models[0]).toMatchObject({ id: kimiModel.id, name: "Kimi K3", contextWindow: 1048576 });
  expect(openai?.endpoints).toEqual([{ protocol: "openai-responses", baseUrl: "https://api.openai.com/v1" }]);
  expect(proxy?.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://proxy.test" }]);
});

test("readProviders round-trips a connected provider", async () => {
  await adapter.connect(makeProvider(), {});
  const [imported] = await adapter.readProviders();
  expect(imported?.id).toBe("fuse");
  expect(imported?.token).toBe("sk-test-fuse");
  expect(imported?.models.map((model) => model.id)).toEqual([kimiModel.id, visionModel.id]);
});

test("readProviders returns nothing for a missing file", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("detect finds the binary or the config dir", async () => {
  expect(await adapter.detect()).toEqual({ installed: false, configPath: settingsPath });
  const withBinary = createQwenAdapter({ configDir: dir }, probesWith(["qwen"]));
  expect((await withBinary.detect()).installed).toBe(true);
  const withDir = createQwenAdapter({ configDir: dir }, probesWith([], [dir]));
  expect((await withDir.detect()).installed).toBe(true);
});

test("adapter metadata and no connect notice", () => {
  expect(adapter.label).toBe("Qwen Code");
  expect(adapter.experimental).toBe(false);
  expect(adapter.exclusive).toBe(false);
  expect(adapter.connectNotice).toBeUndefined();
});

test("connect fails without a usable endpoint", async () => {
  await expect(adapter.connect(makeProvider({ endpoints: [] }), {})).rejects.toThrow("Qwen Code");
});
