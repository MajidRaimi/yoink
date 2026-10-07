import { toProviderProfile } from "./store";
import type { ExternalProfile, ProfileStore, ProviderProfile } from "./types";

const withoutClaudeCodeConnection = (profile: ExternalProfile): ProviderProfile => {
  const provider = toProviderProfile(profile);
  const { "claude-code": _released, ...connections } = provider.connections;
  return { ...provider, connections };
};

export const releaseClaudeCode = (store: ProfileStore): boolean => {
  const previous = store.current ? store.profiles[store.current] : undefined;
  if (previous?.type !== "external") return false;
  store.profiles[previous.name] = withoutClaudeCodeConnection(previous);
  return true;
};
