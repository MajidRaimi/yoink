import { isRecord, type UnknownRecord } from "../../../shared/guards";

export { isRecord };

export type ConfigRecord = UnknownRecord;

export const asRecord = (value: unknown): ConfigRecord => (isRecord(value) ? value : {});

export const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

export const readBoolean = (value: unknown): boolean | undefined => (typeof value === "boolean" ? value : undefined);

export const omitKeys = (record: ConfigRecord, keys: readonly string[]): ConfigRecord =>
  Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
