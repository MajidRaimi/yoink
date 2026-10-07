import { existsSync } from "node:fs";
import { YoinkError } from "../../../shared/errors";
import { claudeConfigDir } from "../../../shared/paths";
import { readOauthAccount } from "../../../shared/claude-config";
import {
  applyExternalEnv,
  clearExternalEnv,
  GLOBAL_SETTINGS_PATH,
  readExternalEnv,
} from "../../../shared/claude-settings";
import { loadStore, saveStore } from "../../profiles/store";
import { findClaudeProfileByEmail } from "../../profiles/lookup";
import type { ProviderProfile } from "../../profiles/types";
import { selectedDefaultModel } from "../../profiles/default-model";
import { switchTo } from "../../switch/service";
import { hostSlug, pickEndpoint, normalizeEndpointUrl } from "../endpoint";
import type { HarnessAdapter, ImportedProvider } from "../types";

const PROTOCOLS = ["anthropic-messages"] as const;
const DEFAULT_CONTEXT_WINDOW = 200000;
const DEFAULT_MAX_OUTPUT = 32000;

const resolveModel = (provider: ProviderProfile, requested: string | undefined): string => {
  const model =
    requested ?? selectedDefaultModel(provider, "claude-code") ?? provider.models[0]?.id ?? provider.model;
  if (!model) throw new YoinkError(`"${provider.name}" has no models selected.`);
  return model;
};

const readProviders = async (): Promise<ImportedProvider[]> => {
  const env = await readExternalEnv(GLOBAL_SETTINGS_PATH);
  const baseUrl = env?.ANTHROPIC_BASE_URL;
  if (!baseUrl) return [];
  const model = env.ANTHROPIC_MODEL;
  return [
    {
      source: "claude-code",
      id: hostSlug(baseUrl),
      displayName: hostSlug(baseUrl),
      token: env.ANTHROPIC_AUTH_TOKEN ?? null,
      endpoints: [{ protocol: "anthropic-messages", baseUrl: normalizeEndpointUrl("anthropic-messages", baseUrl) }],
      models: model
        ? [
            {
              id: model,
              name: model,
              contextWindow: DEFAULT_CONTEXT_WINDOW,
              maxOutput: DEFAULT_MAX_OUTPUT,
              reasoning: false,
              input: ["text"],
            },
          ]
        : [],
    },
  ];
};

const isConnected = async (providerId: string): Promise<boolean> => (await loadStore()).current === providerId;

const readDefaultModel = async (providerId: string): Promise<string | null> =>
  (await isConnected(providerId)) ? ((await readExternalEnv(GLOBAL_SETTINGS_PATH))?.ANTHROPIC_MODEL ?? null) : null;

const connect: HarnessAdapter["connect"] = async (provider, options) => {
  const endpoint = pickEndpoint(provider, PROTOCOLS);
  if (!endpoint) {
    throw new YoinkError(`"${provider.name}" has no Anthropic-compatible endpoint, which Claude Code requires.`);
  }
  const model = resolveModel(provider, options.defaultModel);
  if ((await loadStore()).current !== provider.name) {
    await switchTo(provider.name);
  }
  await applyExternalEnv(GLOBAL_SETTINGS_PATH, { baseUrl: endpoint.baseUrl, token: provider.token, model });
};

const disconnect = async (providerId: string): Promise<void> => {
  const store = await loadStore();
  if (store.current !== providerId) return;
  await clearExternalEnv(GLOBAL_SETTINGS_PATH);
  const liveAccount = await readOauthAccount();
  const fallback = findClaudeProfileByEmail(Object.values(store.profiles), liveAccount?.emailAddress ?? null);
  store.current = fallback?.name ?? null;
  await saveStore(store);
};

export const claudeCodeAdapter: HarnessAdapter = {
  id: "claude-code",
  label: "Claude Code",
  protocols: PROTOCOLS,
  exclusive: true,
  experimental: false,
  setsDefaultModel: true,
  detect: async () => ({
    installed: Bun.which("claude") !== null || existsSync(claudeConfigDir()),
    configPath: GLOBAL_SETTINGS_PATH,
  }),
  readProviders,
  isConnected,
  readDefaultModel,
  connect,
  disconnect,
};
