import { parse as parseWithPatcher, patch } from "@decimalturn/toml-patch";
import { ConfigParseError, YoinkError } from "../../../shared/errors";
import { readTextFile } from "../../../shared/json-file";
import { asRecord, type ConfigRecord } from "./config-values";

export type TomlEdit = {
  text: (source: string) => string;
  object: (config: ConfigRecord) => ConfigRecord;
};

export const parseTomlObject = (path: string, text: string): ConfigRecord => {
  try {
    return asRecord(Bun.TOML.parse(text));
  } catch {
    throw new ConfigParseError(path, new Error("TOML syntax error"));
  }
};

export const readTomlObject = async (path: string): Promise<ConfigRecord | null> => {
  const text = await readTextFile(path);
  return text === null ? null : parseTomlObject(path, text);
};

const matchesExpected = (text: string, expected: ConfigRecord): boolean => {
  try {
    return Bun.deepEquals(Bun.TOML.parse(text), expected);
  } catch {
    return false;
  }
};

const patchWholeDocument = (source: string, edit: TomlEdit): string =>
  patch(source, edit.object(asRecord(parseWithPatcher(source))));

export const applyTomlEdit = (path: string, source: string, edit: TomlEdit): string => {
  const expected = edit.object(parseTomlObject(path, source));
  const surgical = edit.text(source);
  if (matchesExpected(surgical, expected)) return surgical;
  const patched = patchWholeDocument(source, edit);
  if (matchesExpected(patched, expected)) return patched;
  throw new YoinkError(`Could not update ${path} without changing unrelated settings. Edit it by hand.`);
};
