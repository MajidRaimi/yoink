import type { Connection, Connections, HarnessId, ModelSpec, ProviderProfile } from "./types";

const isSelected = (models: ModelSpec[], id: string): boolean => models.some((model) => model.id === id);

export const selectedDefaultModel = (provider: ProviderProfile, harness: HarnessId): string | undefined => {
  const model = provider.connections[harness]?.defaultModel;
  return model && isSelected(provider.models, model) ? model : undefined;
};

export const claudeCodeModel = (provider: ProviderProfile): string =>
  selectedDefaultModel(provider, "claude-code") ??
  (isSelected(provider.models, provider.model) ? provider.model : provider.models[0]?.id) ??
  provider.model;

const withoutStaleDefault = (connection: Connection, models: ModelSpec[]): Connection => {
  if (!connection.defaultModel || isSelected(models, connection.defaultModel)) return connection;
  const { defaultModel: _stale, ...rest } = connection;
  return rest;
};

export const pruneStaleDefaultModels = (connections: Connections, models: ModelSpec[]): Connections =>
  Object.fromEntries(
    Object.entries(connections).map(([id, connection]) => [id, connection && withoutStaleDefault(connection, models)]),
  ) as Connections;
