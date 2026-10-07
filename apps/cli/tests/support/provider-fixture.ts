import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DetectionProbes } from "../../src/features/harnesses/adapters/detection";
import type { Endpoint, ModelSpec, ProviderProfile } from "../../src/features/profiles/types";

export const kimiModel: ModelSpec = {
  id: "moonshotai/Kimi-K3",
  name: "Kimi K3",
  contextWindow: 1048576,
  maxOutput: 32768,
  reasoning: true,
  input: ["text"],
};

export const visionModel: ModelSpec = {
  id: "zai-org/GLM-5.2V",
  name: "GLM 5.2V",
  contextWindow: 262144,
  maxOutput: 16384,
  reasoning: false,
  input: ["text", "image"],
};

export const makeProvider = (overrides: Partial<ProviderProfile> = {}): ProviderProfile => ({
  type: "external",
  name: "fuse",
  provider: "Fuse",
  baseUrl: "https://api.fuse.test",
  token: "sk-test-fuse",
  model: kimiModel.id,
  updatedAt: "2026-01-01T00:00:00.000Z",
  endpoints: [
    { protocol: "openai-chat", baseUrl: "https://api.fuse.test/v1" },
    { protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" },
    { protocol: "anthropic-messages", baseUrl: "https://api.fuse.test" },
  ] satisfies Endpoint[],
  models: [kimiModel, visionModel],
  connections: {},
  ...overrides,
});

export const makeTempDir = (): Promise<string> => mkdtemp(join(tmpdir(), "yoink-harness-"));

export const removeTempDir = (dir: string): Promise<void> => rm(dir, { recursive: true, force: true });

export const probesWith = (binaries: readonly string[], paths: readonly string[] = []): DetectionProbes => ({
  which: (binary) => (binaries.includes(binary) ? `/usr/bin/${binary}` : null),
  exists: async (path) => paths.includes(path),
});

export const readText = (path: string): Promise<string> => Bun.file(path).text();
