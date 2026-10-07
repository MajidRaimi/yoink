import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createOpencodeAdapter } from "../src/features/harnesses/adapters/opencode";
import { createPiAdapter } from "../src/features/harnesses/adapters/pi";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { ownedHarnessIds } from "../src/features/providers/harness-ownership";
import { makeProvider, makeTempDir, probesWith, removeTempDir } from "./support/provider-fixture";

let root: string;
let opencodeDir: string;
let adapters: HarnessAdapter[];

const router = makeProvider({
  name: "openrouter",
  token: "sk-yoink-router",
  endpoints: [{ protocol: "openai-chat", baseUrl: "https://openrouter.ai/api/v1" }],
});

const writeOpencodeEntry = async (apiKey: string): Promise<void> => {
  const config = {
    model: "openrouter/anthropic/claude-x",
    provider: {
      openrouter: {
        npm: "@ai-sdk/openai-compatible",
        options: { baseURL: "https://openrouter.ai/api/v1/", apiKey },
        models: { "anthropic/claude-x": {} },
      },
    },
  };
  await writeFile(join(opencodeDir, "opencode.json"), JSON.stringify(config));
};

beforeEach(async () => {
  root = await makeTempDir();
  opencodeDir = join(root, "opencode");
  await mkdir(opencodeDir, { recursive: true });
  adapters = [
    createPiAdapter({ agentDir: join(root, "pi") }, probesWith([])),
    createOpencodeAdapter({ configDir: opencodeDir, appBundles: [] }, probesWith([])),
  ];
});

afterEach(async () => {
  await removeTempDir(root);
});

test("ownedHarnessIds skips a same-named entry that belongs to the user", async () => {
  await writeOpencodeEntry("sk-users-own-key");
  expect(await ownedHarnessIds(router, adapters)).toEqual([]);
});

test("ownedHarnessIds finds an unrecorded entry that carries this provider's key and URL", async () => {
  await writeOpencodeEntry(router.token);
  expect(await ownedHarnessIds(router, adapters)).toEqual(["opencode"]);
});

test("ownedHarnessIds always includes recorded connections", async () => {
  const connected = { ...router, connections: { pi: { connectedAt: "2026-01-01T00:00:00.000Z" } } };
  expect(await ownedHarnessIds(connected, adapters)).toEqual(["pi"]);
});
