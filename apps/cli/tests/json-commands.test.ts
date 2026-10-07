import { afterEach, beforeEach, expect, test } from "bun:test";
import { makeTempDir, removeTempDir } from "./support/provider-fixture";
import { runCli, type CliResult } from "./support/run-cli";

let home: string;

const cli = (args: readonly string[], stdin?: string): Promise<CliResult> => runCli(home, args, stdin);

beforeEach(async () => {
  home = await makeTempDir();
});

afterEach(async () => {
  await removeTempDir(home);
});

test("presets --json prints one JSON document of presets", async () => {
  const result = await cli(["presets", "--json"]);
  expect(result.exitCode).toBe(0);
  const presets = JSON.parse(result.stdout) as { id: string; label: string; endpoints: unknown[] }[];
  expect(presets.find((preset) => preset.id === "openai")?.endpoints).toContainEqual({
    protocol: "openai-responses",
    baseUrl: "https://api.openai.com/v1",
  });
});

test("status --json reports every harness for a provider with its recorded default", async () => {
  const added = await cli(
    [
      "add",
      "--name",
      "fuse",
      "--base-url",
      "https://example.invalid",
      "--protocol",
      "openai-chat",
      "--models",
      "m1,m2",
      "--connect",
      "pi",
      "--default",
      "m2",
      "--token-stdin",
    ],
    "FAKEKEY",
  );
  expect(added.exitCode).toBe(0);

  const result = await cli(["status", "fuse", "--json"]);

  expect(result.exitCode).toBe(0);
  expect(result.stdout).not.toContain("FAKEKEY");
  const statuses = JSON.parse(result.stdout) as Record<string, unknown>[];
  expect(statuses.map((entry) => entry.id).sort()).toEqual(["claude-code", "codex", "omp", "opencode", "pi"]);
  const pi = statuses.find((entry) => entry.id === "pi");
  expect(pi).toMatchObject({ connected: true, compatible: true, exclusive: false, defaultModel: "m2", parseError: null });
  expect(Object.keys(pi ?? {}).sort()).toEqual(
    ["compatible", "configPath", "connected", "defaultModel", "exclusive", "id", "installed", "label", "parseError"],
  );
  expect(statuses.find((entry) => entry.id === "codex")).toMatchObject({ compatible: false, connected: false });
});

test("status fails cleanly for an unknown provider", async () => {
  const result = await cli(["status", "missing", "--json"]);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe("");
  expect(result.stderr).toContain('No profile named "missing"');
});

test("probe requires a target and a token on stdin", async () => {
  const noTarget = await cli(["probe", "--token-stdin", "--json"], "KEY");
  expect(noTarget.exitCode).toBe(1);
  expect(noTarget.stdout).toBe("");
  expect(noTarget.stderr).toContain("Usage: yoink probe");

  const noToken = await cli(["probe", "--preset", "openai", "--json"]);
  expect(noToken.exitCode).toBe(1);
  expect(noToken.stdout).toBe("");
  expect(noToken.stderr).toContain("--token-stdin");

  const unknownPreset = await cli(["probe", "--preset", "nope", "--token-stdin", "--json"], "KEY");
  expect(unknownPreset.exitCode).toBe(1);
  expect(unknownPreset.stdout).toBe("");
  expect(unknownPreset.stderr).toContain('Unknown preset "nope"');
});

const PROBE_KEY = "sk-probe-secret-key";
const PROBE_MODELS = ["chat-small", "chat-large"];

const isAuthorized = (request: Request): boolean => request.headers.get("authorization") === `Bearer ${PROBE_KEY}`;

const openaiCompatibleResponse = (request: Request): Response => {
  const { pathname } = new URL(request.url);
  if (!isAuthorized(request)) return Response.json({ error: { message: "unauthorized" } }, { status: 401 });
  if (request.method === "GET" && pathname === "/v1/models") {
    return Response.json({ object: "list", data: PROBE_MODELS.map((id) => ({ id, object: "model" })) });
  }
  if (request.method === "POST" && pathname === "/v1/chat/completions") {
    return Response.json({
      id: "chatcmpl-1",
      object: "chat.completion",
      choices: [{ index: 0, message: { role: "assistant", content: "pong" }, finish_reason: "length" }],
    });
  }
  return Response.json({ error: { message: "not found" } }, { status: 404 });
};

const withProbeServer = async (run: (baseUrl: string) => Promise<void>): Promise<void> => {
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: openaiCompatibleResponse });
  try {
    await run(`http://127.0.0.1:${server.port}`);
  } finally {
    await server.stop(true);
  }
};

test("probe --json prints only the discovered endpoints and models on success", async () => {
  await withProbeServer(async (baseUrl) => {
    const result = await cli(["probe", "--base-url", baseUrl, "--token-stdin", "--json"], PROBE_KEY);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain(PROBE_KEY);
    const probe = JSON.parse(result.stdout) as { endpoints: unknown[]; models: { id: string }[] };
    expect(probe.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: `${baseUrl}/v1` }]);
    expect(probe.models.map((model) => model.id).sort()).toEqual([...PROBE_MODELS].sort());
  });
});
