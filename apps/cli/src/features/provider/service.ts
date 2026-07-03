import { YoinkError } from "../../shared/errors";
import type { ProviderModel } from "./types";

type RawModel = { id?: unknown; name?: unknown; display_name?: unknown };

export const normalizeBaseUrl = (raw: string): string => raw.trim().replace(/\/+$/, "");

export const fetchModels = async (baseUrl: string, token: string): Promise<ProviderModel[]> => {
  const url = `${normalizeBaseUrl(baseUrl)}/v1/models`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  } catch (error) {
    throw new YoinkError(
      `Could not reach ${url}: ${error instanceof Error ? error.message : "network error"}`,
    );
  }
  if (!response.ok) {
    throw new YoinkError(
      `Provider rejected the request (${response.status} ${response.statusText}). Check the base URL and API key.`,
    );
  }

  const body = (await response.json()) as { data?: RawModel[]; models?: RawModel[] } | RawModel[];
  const raw = Array.isArray(body) ? body : (body.data ?? body.models ?? []);
  const models = raw
    .filter((entry): entry is RawModel & { id: string } => typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id,
      name:
        typeof entry.name === "string"
          ? entry.name
          : typeof entry.display_name === "string"
            ? entry.display_name
            : entry.id,
    }));

  if (models.length === 0) throw new YoinkError("The provider returned no models.");
  return models;
};
