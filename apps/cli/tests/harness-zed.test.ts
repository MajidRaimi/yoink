import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createZedAdapter, zedApiKeyVariable, zedConfigDirFor } from "../src/features/harnesses/adapters/zed";
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

type ZedModelEntry = { name: string; capabilities?: Record<string, unknown> };

type ZedSettings = {
  language_models?: Record<string, Record<string, unknown>>;
  agent?: Record<string, unknown>;
  [key: string]: unknown;
};

let root: string;
let dir: string;
let settingsPath: string;
let adapter: HarnessAdapter;

const appBundle = "/Applications/Zed.app";

const commentedSettings = `// Zed settings
{
  "theme": "One Dark", // my theme
  "language_models": {
    /* local models */
    "openai_compatible": {
      "Together AI": {
        "api_url": "https://api.together.xyz/v1",
        "available_models": [{ "name": "mixtral", "max_tokens": 32768 }],
      },
    },
  },
  "agent": {
    "default_model": { "provider": "zed.dev", "model": "claude-sonnet-4" },
  },
}
`;

const realisticSettings = {
  theme: "One Dark",
  language_models: {
    openai_compatible: {
      fuse: {
        api_url: "https://api.fuse.test/v1",
        available_models: [
          {
            name: "moonshotai/Kimi-K3",
            display_name: "Kimi K3",
            max_tokens: 1048576,
            max_output_tokens: 32768,
            capabilities: { tools: true, images: false, parallel_tool_calls: true, chat_completions: true },
          },
          {
            name: "zai-org/GLM-5.2V",
            display_name: "GLM 5.2V",
            max_tokens: 262144,
            max_output_tokens: 16384,
            capabilities: { tools: true, images: true },
          },
        ],
      },
      router: {
        api_url: "https://router.test/v1/",
        available_models: [{ name: "gpt-x", max_tokens: 400000, capabilities: { chat_completions: false } }],
      },
    },
    anthropic_compatible: {
      claude: { api_url: "https://proxy.test", available_models: [{ name: "claude-x", display_name: "Claude X" }] },
    },
    anthropic: { api_url: "https://api.anthropic.com" },
  },
  agent: { default_model: { provider: "fuse", model: "moonshotai/Kimi-K3" }, always_allow_tool_actions: true },
};

const writeSettings = async (contents: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(settingsPath, contents);
};

const readSettings = async (): Promise<ZedSettings> => parse(await readText(settingsPath));

const fuseEntry = async (kind: string): Promise<Record<string, unknown> | undefined> =>
  (await readSettings()).language_models?.[kind]?.fuse as Record<string, unknown> | undefined;

beforeEach(async () => {
  root = await makeTempDir();
  dir = join(root, "zed");
  settingsPath = join(dir, "settings.json");
  adapter = createZedAdapter({ configDir: dir, appBundles: [appBundle] }, probesWith([]));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect creates settings.json with mode 0600 and an openai_compatible entry without a key", async () => {
  await adapter.connect(makeProvider(), {});
  await expectMode(settingsPath, 0o600);
  expect(await readSettings()).toEqual({
    language_models: {
      openai_compatible: {
        fuse: {
          api_url: "https://api.fuse.test/v1",
          available_models: [
            {
              name: kimiModel.id,
              display_name: "Kimi K3",
              max_tokens: 1048576,
              max_output_tokens: 32768,
              capabilities: {
                tools: true,
                parallel_tool_calls: false,
                prompt_cache_key: false,
                images: false,
                chat_completions: true,
              },
            },
            {
              name: visionModel.id,
              display_name: "GLM 5.2V",
              max_tokens: 262144,
              max_output_tokens: 16384,
              capabilities: {
                tools: true,
                parallel_tool_calls: false,
                prompt_cache_key: false,
                images: true,
                chat_completions: true,
              },
            },
          ],
        },
      },
    },
  });
  expect(await readText(settingsPath)).not.toContain("sk-test-fuse");
});

test("connect uses chat_completions false for a responses only provider", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://r.test/v1/" }] }), {});
  const entry = await fuseEntry("openai_compatible");
  expect(entry?.api_url).toBe("https://r.test/v1");
  const models = entry?.available_models as ZedModelEntry[];
  expect(models.every((model) => model.capabilities?.chat_completions === false)).toBe(true);
});

test("connect writes anthropic_compatible without /v1 when only anthropic is available", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test/v1" }] }), {});
  const entry = await fuseEntry("anthropic_compatible");
  expect(entry?.api_url).toBe("https://a.test");
  expect((entry?.available_models as unknown[])[0]).toEqual({
    name: kimiModel.id,
    display_name: "Kimi K3",
    max_tokens: 1048576,
    max_output_tokens: 32768,
  });
  expect((await readSettings()).language_models?.openai_compatible).toBeUndefined();
});

test("connect rejects a provider without a usable endpoint", async () => {
  await expect(adapter.connect(makeProvider({ endpoints: [] }), {})).rejects.toThrow("Zed");
});

test("connect preserves comments and unrelated settings", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), {});
  const text = await readText(settingsPath);
  for (const marker of ["// Zed settings", "// my theme", "/* local models */"]) expect(text).toContain(marker);
  const settings = await readSettings();
  expect(settings.theme).toBe("One Dark");
  expect(Object.keys(settings.language_models?.openai_compatible ?? {})).toEqual(["Together AI", "fuse"]);
  expect(settings.agent?.default_model).toEqual({ provider: "zed.dev", model: "claude-sonnet-4" });
  expect(await readText(`${settingsPath}.yoink.bak`)).toBe(commentedSettings);
});

test("connect overwrites the same id, keeps unmanaged fields and moves between kinds", async () => {
  await writeSettings(JSON.stringify(realisticSettings, null, 2));
  await adapter.connect(makeProvider(), {});
  const models = (await fuseEntry("openai_compatible"))?.available_models as ZedModelEntry[];
  expect(models.map((model) => model.name)).toEqual([kimiModel.id, visionModel.id]);
  expect(models[0]?.capabilities?.parallel_tool_calls).toBe(true);
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test" }] }), {});
  const settings = await readSettings();
  expect(settings.language_models?.openai_compatible?.fuse).toBeUndefined();
  expect(Object.keys(settings.language_models?.openai_compatible ?? {})).toEqual(["router"]);
  expect(Object.keys(settings.language_models?.anthropic_compatible ?? {})).toEqual(["claude", "fuse"]);
  expect(settings.language_models?.anthropic).toEqual(realisticSettings.language_models.anthropic);
});

test("connect sets the default model and readDefaultModel reports it", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  expect((await readSettings()).agent?.default_model).toEqual({ provider: "fuse", model: visionModel.id });
  expect(await adapter.readDefaultModel("fuse")).toBe(visionModel.id);
  expect(await adapter.readDefaultModel("other")).toBeNull();
  expect(await adapter.isConnected("fuse")).toBe(true);
});

test("disconnect removes the entry and clears a default pointing at it", async () => {
  await writeSettings(JSON.stringify(realisticSettings, null, 2));
  await adapter.disconnect("fuse");
  const settings = await readSettings();
  expect(Object.keys(settings.language_models?.openai_compatible ?? {})).toEqual(["router"]);
  expect(settings.agent).toEqual({ always_allow_tool_actions: true });
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
});

test("disconnect leaves other providers and a default pointing elsewhere", async () => {
  await writeSettings(commentedSettings);
  await adapter.disconnect("together");
  expect(await readText(settingsPath)).toBe(commentedSettings);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  const settings = await readSettings();
  expect(Object.keys(settings.language_models?.openai_compatible ?? {})).toEqual(["Together AI"]);
  expect(settings.agent?.default_model).toEqual({ provider: "zed.dev", model: "claude-sonnet-4" });
});

test("disconnect is a no-op when the file is missing", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(settingsPath).exists()).toBe(false);
});

test("connect then disconnect round-trips the original settings", async () => {
  await writeSettings(commentedSettings);
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  const { agent: _replaced, ...withoutAgent } = parse(commentedSettings) as ZedSettings;
  expect(await readSettings()).toEqual(withoutAgent);
  const text = await readText(settingsPath);
  for (const marker of ["// Zed settings", "// my theme", "/* local models */"]) expect(text).toContain(marker);
});

test("connect into an empty settings file then disconnect leaves an empty object", async () => {
  await writeSettings("");
  await adapter.connect(makeProvider(), { defaultModel: kimiModel.id });
  await adapter.disconnect("fuse");
  expect(await readSettings()).toEqual({});
});

test("readProviders imports a realistic settings file", async () => {
  await writeSettings(JSON.stringify(realisticSettings, null, 2));
  expect(await adapter.readProviders()).toEqual([
    {
      source: "zed",
      id: "fuse",
      displayName: "fuse",
      token: null,
      endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }],
      models: [
        { ...kimiModel, reasoning: false },
        { ...visionModel },
      ],
    },
    {
      source: "zed",
      id: "router",
      displayName: "router",
      token: null,
      endpoints: [{ protocol: "openai-responses", baseUrl: "https://router.test/v1" }],
      models: [{ id: "gpt-x", name: "gpt-x", contextWindow: 400000, maxOutput: 32000, reasoning: false, input: ["text"] }],
    },
    {
      source: "zed",
      id: "claude",
      displayName: "claude",
      token: null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://proxy.test" }],
      models: [{ id: "claude-x", name: "Claude X", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text"] }],
    },
  ]);
});

test("readProviders returns an empty list when settings are missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("connectNotice names the api key variable and never contains the key", () => {
  const notice = adapter.connectNotice?.(makeProvider({ name: "my-fuse.ai" }));
  expect(zedApiKeyVariable("my-fuse.ai")).toBe("MY_FUSE_AI_API_KEY");
  expect(notice).toContain("MY_FUSE_AI_API_KEY");
  expect(notice).toContain("agent settings");
  expect(notice).not.toContain("sk-test-fuse");
  expect(adapter.experimental).toBe(true);
  expect(adapter.exclusive).toBe(false);
});

test("detect covers both binaries, the config dir and the app bundle", async () => {
  const paths = { configDir: dir, appBundles: [appBundle] };
  expect((await adapter.detect()).installed).toBe(false);
  expect((await adapter.detect()).configPath).toBe(settingsPath);
  expect((await createZedAdapter(paths, probesWith(["zed"])).detect()).installed).toBe(true);
  expect((await createZedAdapter(paths, probesWith(["zeditor"])).detect()).installed).toBe(true);
  expect((await createZedAdapter(paths, probesWith([], [appBundle])).detect()).installed).toBe(true);
  expect((await createZedAdapter(paths, probesWith([], [dir])).detect()).installed).toBe(true);
});

test("config dir follows XDG, home and the Windows APPDATA location", () => {
  expect(zedConfigDirFor({ platform: "linux", home: "/home/me" })).toBe(join("/home/me", ".config", "zed"));
  expect(zedConfigDirFor({ platform: "darwin", home: "/Users/me", xdgConfigHome: "/x" })).toBe(join("/x", "zed"));
  expect(zedConfigDirFor({ platform: "win32", home: "C:\\me", appData: "C:\\me\\AppData\\Roaming" })).toBe(
    join("C:\\me\\AppData\\Roaming", "Zed"),
  );
});

test("default model write keeps extra keys on agent.default_model", async () => {
  await writeSettings(
    JSON.stringify({ agent: { default_model: { provider: "zed.dev", model: "claude-sonnet-4", enable_thinking: true } } }),
  );
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  expect((await readSettings()).agent?.default_model).toEqual({
    provider: "fuse",
    model: visionModel.id,
    enable_thinking: true,
  });
});
