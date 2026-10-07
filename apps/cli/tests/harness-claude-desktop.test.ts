import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  claudeDesktopAdapter,
  claudeDesktopConfigDir,
  createClaudeDesktopAdapter,
} from "../src/features/harnesses/adapters/claude-desktop";
import type { HarnessAdapter } from "../src/features/harnesses/types";
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

let root: string;
let configDir: string;
let library: string;
let fusePath: string;
let adapter: HarnessAdapter;

const appBundle = "/Applications/Claude.app";

const readJson = async (path: string): Promise<Record<string, unknown>> => JSON.parse(await readText(path));

const writeLibraryFile = async (name: string, contents: string): Promise<string> => {
  await mkdir(library, { recursive: true });
  const path = join(library, name);
  await writeFile(path, contents);
  return path;
};

beforeEach(async () => {
  root = await makeTempDir();
  configDir = join(root, "Claude-3p");
  library = join(configDir, "configLibrary");
  fusePath = join(library, "yoink-fuse.json");
  adapter = createClaudeDesktopAdapter({ configDir, appBundles: [appBundle] }, probesWith([]));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("adapter metadata is experimental, non exclusive and anthropic only", () => {
  expect(claudeDesktopAdapter.id).toBe("claude-desktop");
  expect(claudeDesktopAdapter.label).toBe("Claude Desktop");
  expect(claudeDesktopAdapter.experimental).toBe(true);
  expect(claudeDesktopAdapter.exclusive).toBe(false);
  expect(claudeDesktopAdapter.protocols).toEqual(["anthropic-messages"]);
});

test("connect creates the library file with mode 0600 and the gateway fields", async () => {
  await adapter.connect(makeProvider(), {});
  expect(await fileMode(fusePath)).toBe(0o600);
  expect(await readJson(fusePath)).toEqual({
    inferenceProvider: "gateway",
    inferenceGatewayBaseUrl: "https://api.fuse.test",
    inferenceGatewayApiKey: "sk-test-fuse",
    inferenceModels: [kimiModel.id, visionModel.id],
  });
  expect(await Bun.file(join(library, "_meta.json")).exists()).toBe(false);
  expect(await adapter.isConnected("fuse")).toBe(true);
});

test("connect strips a trailing /v1 from the anthropic endpoint", async () => {
  await adapter.connect(makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://a.test/v1/" }] }), {});
  expect((await readJson(fusePath)).inferenceGatewayBaseUrl).toBe("https://a.test");
});

test("connect rejects a provider without an anthropic endpoint", async () => {
  const provider = makeProvider({ endpoints: [{ protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" }] });
  await expect(adapter.connect(provider, {})).rejects.toThrow("anthropic-messages");
  expect(await Bun.file(fusePath).exists()).toBe(false);
});

test("connect puts the requested default model first", async () => {
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  expect((await readJson(fusePath)).inferenceModels).toEqual([visionModel.id, kimiModel.id]);
  expect(await adapter.readDefaultModel("fuse")).toBe(visionModel.id);
});

test("connect without a default falls back to the provider model order", async () => {
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  await adapter.connect(makeProvider(), {});
  expect(await adapter.readDefaultModel("fuse")).toBe(kimiModel.id);
});

test("connect overwrites the same id and preserves unmanaged keys in that file", async () => {
  const original = JSON.stringify({
    inferenceProvider: "gateway",
    inferenceGatewayBaseUrl: "https://old.test",
    inferenceGatewayApiKey: "sk-old",
    inferenceModels: ["old-model"],
    disableAutoUpdates: true,
  });
  await writeLibraryFile("yoink-fuse.json", original);
  await adapter.connect(makeProvider({ token: "sk-new" }), {});
  expect(await readJson(fusePath)).toEqual({
    disableAutoUpdates: true,
    inferenceProvider: "gateway",
    inferenceGatewayBaseUrl: "https://api.fuse.test",
    inferenceGatewayApiKey: "sk-new",
    inferenceModels: [kimiModel.id, visionModel.id],
  });
  expect(await Bun.file(`${fusePath}.yoink.bak`).exists()).toBe(false);
});

test("reconnecting never leaves a backup holding the old key", async () => {
  await adapter.connect(makeProvider({ token: "sk-old" }), {});
  await adapter.connect(makeProvider({ token: "sk-new" }), {});
  expect(await Bun.file(`${fusePath}.yoink.bak`).exists()).toBe(false);
  expect((await readJson(fusePath)).inferenceGatewayApiKey).toBe("sk-new");
});

test("disconnect removes a stale backup of the provider file", async () => {
  const backupPath = await writeLibraryFile("yoink-fuse.json.yoink.bak", JSON.stringify({ inferenceGatewayApiKey: "sk-old" }));
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await Bun.file(fusePath).exists()).toBe(false);
  expect(await Bun.file(backupPath).exists()).toBe(false);
});

test("connect leaves other library configs and _meta.json untouched", async () => {
  const otherText = JSON.stringify({ inferenceProvider: "bedrock", inferenceBedrockRegion: "us-east-1" });
  const metaText = JSON.stringify({ selected: "corp" });
  const otherPath = await writeLibraryFile("corp.json", otherText);
  const metaPath = await writeLibraryFile("_meta.json", metaText);
  await adapter.connect(makeProvider(), {});
  await adapter.disconnect("fuse");
  expect(await readText(otherPath)).toBe(otherText);
  expect(await readText(metaPath)).toBe(metaText);
});

test("disconnect removes only the file for that provider and clears its default", async () => {
  await adapter.connect(makeProvider(), { defaultModel: visionModel.id });
  await adapter.connect(makeProvider({ name: "other" }), {});
  await adapter.disconnect("fuse");
  expect(await Bun.file(fusePath).exists()).toBe(false);
  expect(await adapter.isConnected("fuse")).toBe(false);
  expect(await adapter.readDefaultModel("fuse")).toBeNull();
  expect(await adapter.isConnected("other")).toBe(true);
  expect(await adapter.readDefaultModel("other")).toBe(kimiModel.id);
});

test("disconnect ignores user files whose name lacks the yoink prefix", async () => {
  const userText = JSON.stringify({ inferenceGatewayBaseUrl: "https://mine.test", inferenceModels: ["m"] });
  const userPath = await writeLibraryFile("fuse.json", userText);
  await adapter.disconnect("fuse");
  expect(await readText(userPath)).toBe(userText);
  expect(await adapter.isConnected("fuse")).toBe(false);
});

test("disconnect is a no-op when nothing is connected", async () => {
  await adapter.disconnect("fuse");
  expect(await Bun.file(library).exists()).toBe(false);
});

test("readProviders imports gateway configs from the library", async () => {
  await writeLibraryFile(
    "yoink-fuse.json",
    JSON.stringify({
      inferenceProvider: "gateway",
      inferenceGatewayBaseUrl: "https://api.fuse.test/v1",
      inferenceGatewayApiKey: "sk-test",
      inferenceModels: ["moonshotai/Kimi-K3", "zai-org/GLM-5.2"],
    }),
  );
  await writeLibraryFile(
    "corp-gateway.json",
    JSON.stringify({
      name: "Corp Gateway",
      inferenceProvider: "gateway",
      inferenceGatewayBaseUrl: "https://llm.corp.test",
      inferenceGatewayApiKey: "${CORP_KEY}",
      inferenceModels: JSON.stringify([{ name: "claude-x", displayName: "Claude X" }]),
    }),
  );
  await writeLibraryFile("bedrock.json", JSON.stringify({ inferenceProvider: "bedrock", inferenceModels: ["a"] }));
  await writeLibraryFile("_meta.json", JSON.stringify({ inferenceGatewayBaseUrl: "https://meta.test" }));
  await writeLibraryFile("notes.txt", "not a config");
  const defaults = { contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text" as const] };
  expect(await adapter.readProviders()).toEqual([
    {
      source: "claude-desktop",
      id: "corp-gateway",
      displayName: "Corp Gateway",
      token: null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://llm.corp.test" }],
      models: [{ id: "claude-x", name: "Claude X", ...defaults }],
    },
    {
      source: "claude-desktop",
      id: "fuse",
      displayName: "fuse",
      token: "sk-test",
      endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test" }],
      models: [
        { id: "moonshotai/Kimi-K3", name: "moonshotai/Kimi-K3", ...defaults },
        { id: "zai-org/GLM-5.2", name: "zai-org/GLM-5.2", ...defaults },
      ],
    },
  ]);
});

test("readProviders returns an empty list when the library is missing", async () => {
  expect(await adapter.readProviders()).toEqual([]);
});

test("invalid json in the library raises a parse error", async () => {
  await writeLibraryFile("yoink-fuse.json", "{ \"inferenceModels\": ");
  await expect(adapter.readProviders()).rejects.toThrow("Could not parse");
});

test("connectNotice explains how to select the config", () => {
  const notice = adapter.connectNotice?.(makeProvider());
  expect(notice).toBe(
    "Open Claude Desktop, go to Developer, Configure third-party inference, select the yoink-fuse config, then relaunch Claude Desktop.",
  );
  expect(notice).not.toContain("sk-test-fuse");
});

test("detect covers the app bundle and the Claude-3p dir", async () => {
  const paths = { configDir, appBundles: [appBundle] };
  expect(await adapter.detect()).toEqual({ installed: false, configPath: library });
  expect((await createClaudeDesktopAdapter(paths, probesWith([], [appBundle])).detect()).installed).toBe(true);
  expect((await createClaudeDesktopAdapter(paths, probesWith([], [configDir])).detect()).installed).toBe(true);
});

test("config dir follows the platform conventions", () => {
  const home = "/home/me";
  expect(claudeDesktopConfigDir({ platform: "darwin", home, localAppData: undefined, xdgConfigHome: undefined })).toBe(
    join(home, "Library", "Application Support", "Claude-3p"),
  );
  expect(claudeDesktopConfigDir({ platform: "win32", home, localAppData: "C:\\Local", xdgConfigHome: undefined })).toBe(
    join("C:\\Local", "Claude-3p"),
  );
  expect(claudeDesktopConfigDir({ platform: "linux", home, localAppData: undefined, xdgConfigHome: undefined })).toBe(
    join(home, ".config", "Claude-3p"),
  );
  expect(claudeDesktopConfigDir({ platform: "linux", home, localAppData: undefined, xdgConfigHome: "/xdg" })).toBe(
    join("/xdg", "Claude-3p"),
  );
});
