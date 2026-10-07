import { afterEach, beforeEach, expect, setDefaultTimeout, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeTempDir, readText, removeTempDir } from "./support/provider-fixture";
import { CLI_TEST_TIMEOUT_MS, runCli, scratchHomeEnv } from "./support/run-cli";

setDefaultTimeout(CLI_TEST_TIMEOUT_MS);

type StoredEndpoint = { protocol: string; baseUrl: string };

type StoredStore = {
  current: string | null;
  profiles: Record<string, { endpoints?: StoredEndpoint[]; baseUrl?: string } & Record<string, unknown>>;
};

const ANTHROPIC_URL = "https://example.invalid";
const OPENAI_URL = "https://example.invalid/openai/v1";
const SERVICE_ENTRY = fileURLToPath(new URL("../src/features/providers/service.ts", import.meta.url));

let home: string;

const storePath = (): string => join(home, ".config", "yoink", "profiles.json");

const claudeSettingsPath = (): string => join(home, ".claude", "settings.json");

const readStore = async (): Promise<StoredStore> => JSON.parse(await readText(storePath())) as StoredStore;

const addCurrentDualProvider = async (): Promise<void> => {
  const added = await runCli(
    home,
    [
      "add",
      "--name",
      "prov",
      "--endpoint",
      `anthropic-messages=${ANTHROPIC_URL},openai-chat=${OPENAI_URL}`,
      "--models",
      "m1",
      "--token-stdin",
    ],
    "FAKEKEY",
  );
  expect(added.exitCode).toBe(0);
  expect((await runCli(home, ["use", "prov"])).exitCode).toBe(0);
  expect(await readText(claudeSettingsPath())).toContain(ANTHROPIC_URL);
};

const dropAnthropicEndpointOnDisk = async (): Promise<void> => {
  const store = await readStore();
  const provider = store.profiles.prov;
  if (!provider) throw new Error("prov missing from the store");
  provider.endpoints = (provider.endpoints ?? []).filter((endpoint) => endpoint.protocol !== "anthropic-messages");
  provider.baseUrl = OPENAI_URL;
  await writeFile(storePath(), JSON.stringify(store, null, 2));
};

const updateEndpointsInHome = async (endpoints: readonly StoredEndpoint[]): Promise<string> => {
  const script = `
    const { updateProvider } = await import(${JSON.stringify(SERVICE_ENTRY)});
    try {
      await updateProvider("prov", { endpoints: ${JSON.stringify(endpoints)} });
      console.log("updated");
    } catch (error) {
      console.log(error instanceof Error ? error.message : String(error));
    }
  `;
  const child = Bun.spawn([process.execPath, "-e", script], {
    env: scratchHomeEnv(home),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout] = await Promise.all([new Response(child.stdout).text(), child.exited]);
  return stdout.trim();
};

beforeEach(async () => {
  home = await makeTempDir();
});

afterEach(async () => {
  await removeTempDir(home);
});

test("edit never writes an OpenAI endpoint into Claude Code's ANTHROPIC_BASE_URL", async () => {
  await addCurrentDualProvider();
  await dropAnthropicEndpointOnDisk();

  await runCli(home, ["edit", "prov", "--token-stdin"], "SECONDKEY");

  const settings = await readText(claudeSettingsPath());
  expect(settings).not.toContain("/openai");
  expect(settings).toContain(ANTHROPIC_URL);
});

test("edit re-points Claude Code at the Anthropic endpoint of a dual-protocol provider", async () => {
  await addCurrentDualProvider();

  const result = await runCli(home, ["edit", "prov", "--token-stdin"], "SECONDKEY");

  expect(result.exitCode).toBe(0);
  const settings = await readText(claudeSettingsPath());
  expect(settings).toContain(ANTHROPIC_URL);
  expect(settings).not.toContain("/openai");
  expect(settings).toContain("SECONDKEY");
});

test("updateProvider refuses to drop the Anthropic endpoint while the provider is active in Claude Code", async () => {
  await addCurrentDualProvider();

  const message = await updateEndpointsInHome([{ protocol: "openai-chat", baseUrl: OPENAI_URL }]);

  expect(message).toContain("is active in Claude Code");
  const stored = (await readStore()).profiles.prov;
  expect(stored?.endpoints?.map((endpoint) => endpoint.protocol)).toContain("anthropic-messages");
  expect(await readText(claudeSettingsPath())).not.toContain("/openai");
});

test("updateProvider still drops the Anthropic endpoint when the provider is not active in Claude Code", async () => {
  const added = await runCli(
    home,
    ["add", "--name", "prov", "--endpoint", `anthropic-messages=${ANTHROPIC_URL},openai-chat=${OPENAI_URL}`, "--models", "m1", "--token-stdin"],
    "FAKEKEY",
  );
  expect(added.exitCode).toBe(0);

  expect(await updateEndpointsInHome([{ protocol: "openai-chat", baseUrl: OPENAI_URL }])).toBe("updated");
  const stored = (await readStore()).profiles.prov;
  expect(stored?.endpoints?.map((endpoint) => endpoint.protocol)).toEqual(["openai-chat"]);
});
