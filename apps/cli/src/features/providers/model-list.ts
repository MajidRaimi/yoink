import { isRecord, readString } from "../../shared/guards";
import type { ProviderModel } from "./types";

const rawEntries = (body: unknown): unknown[] | null => {
  if (Array.isArray(body)) return body;
  if (!isRecord(body)) return null;
  const list = body.data ?? body.models;
  return Array.isArray(list) ? list : null;
};

const toProviderModel = (entry: unknown): ProviderModel | null => {
  if (!isRecord(entry)) return null;
  const id = readString(entry.id);
  if (id === undefined) return null;
  return { id, name: readString(entry.name) ?? readString(entry.display_name) ?? id };
};

export const parseModelList = (body: unknown): ProviderModel[] | null => {
  const entries = rawEntries(body);
  if (entries === null) return null;
  return entries.map(toProviderModel).filter((model): model is ProviderModel => model !== null);
};

export const mergeModelLists = (...lists: ProviderModel[][]): ProviderModel[] => {
  const unique = new Map<string, ProviderModel>();
  for (const model of lists.flat()) if (!unique.has(model.id)) unique.set(model.id, model);
  return [...unique.values()];
};
