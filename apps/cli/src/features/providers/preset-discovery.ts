import { YoinkError } from "../../shared/errors";
import type { ProviderPreset } from "./presets";
import { fetchProviderModels } from "./probe";
import type { Fetcher, ProbeResult } from "./types";

const AUTH_CHECK_TIMEOUT_MS = 8000;
const REJECTED_KEY_STATUSES = new Set([401, 403]);

const requestAuthCheck = async (fetcher: Fetcher, url: string, token: string): Promise<Response | null> => {
  try {
    return await fetcher(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(AUTH_CHECK_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
};

export const verifyPresetKey = async (preset: ProviderPreset, token: string, fetcher: Fetcher = fetch): Promise<void> => {
  if (!preset.authCheckUrl) return;
  const response = await requestAuthCheck(fetcher, preset.authCheckUrl, token);
  if (!response) throw new YoinkError(`Could not reach ${preset.label} to check the API key. Check your connection.`);
  if (REJECTED_KEY_STATUSES.has(response.status)) {
    throw new YoinkError(`${preset.label} rejected the API key (${response.status}). Check the key and try again.`);
  }
};

export const discoverPreset = async (
  preset: ProviderPreset,
  token: string,
  fetcher: Fetcher = fetch,
): Promise<ProbeResult> => {
  const listingEndpoint = preset.endpoints[0];
  if (!listingEndpoint) throw new YoinkError(`${preset.label} has no endpoints configured.`);
  const [models] = await Promise.all([
    fetchProviderModels(listingEndpoint, token, fetcher),
    verifyPresetKey(preset, token, fetcher),
  ]);
  return { endpoints: [...preset.endpoints], models };
};
