import { applyEdits, modify, parse, printParseErrorCode, type JSONPath, type ParseError } from "jsonc-parser";
import { ConfigParseError, YoinkError } from "../../../shared/errors";
import { readOptionalText } from "../../../shared/fs-errors";
import { isRecord, type ConfigRecord } from "./config-values";

const FORMATTING = { insertSpaces: true, tabSize: 2, eol: "\n" } as const;

const errorNames = (errors: readonly ParseError[]): string[] =>
  errors.map((error) => printParseErrorCode(error.error));

const holdsNoValue = (parsed: unknown, errors: readonly ParseError[]): boolean =>
  parsed === undefined && errorNames(errors).join() === "ValueExpected";

export const parseJsoncObject = (path: string, text: string): ConfigRecord => {
  const errors: ParseError[] = [];
  const parsed: unknown = parse(text, errors, { allowTrailingComma: true });
  if (holdsNoValue(parsed, errors)) return {};
  const [firstName] = errorNames(errors);
  if (firstName) throw new ConfigParseError(path, new Error(firstName));
  if (!isRecord(parsed)) throw new YoinkError(`Expected a JSON object in ${path}.`);
  return parsed;
};

export const setJsoncValue = (text: string, path: JSONPath, value: unknown): string =>
  applyEdits(text, modify(text, path, value, { formattingOptions: FORMATTING }));

export const removeJsoncValue = (text: string, path: JSONPath): string => setJsoncValue(text, path, undefined);

const isEmptyObjectAt = (text: string, path: JSONPath): boolean => {
  const parsed: unknown = parse(text, [], { allowTrailingComma: true });
  const value = path.reduce<unknown>((current, key) => (isRecord(current) ? current[String(key)] : undefined), parsed);
  return isRecord(value) && Object.keys(value).length === 0;
};

export const pruneEmptyJsoncObjects = (text: string, paths: readonly JSONPath[]): string =>
  paths.reduce((current, path) => (isEmptyObjectAt(current, path) ? removeJsoncValue(current, path) : current), text);

export type JsoncDocument = { path: string; text: string; config: ConfigRecord };

export const loadJsoncDocument = async (path: string): Promise<JsoncDocument | null> => {
  const text = await readOptionalText(path);
  return text === null ? null : { path, text, config: parseJsoncObject(path, text) };
};

export const seedJsoncText = (loaded: JsoncDocument | null, fallback = "{}\n"): string =>
  loaded && loaded.text.trim().length > 0 ? loaded.text : fallback;

export const setJsoncFields = (text: string, path: JSONPath, existing: unknown, fields: ConfigRecord): string =>
  isRecord(existing)
    ? Object.entries(fields).reduce((current, [key, value]) => setJsoncValue(current, [...path, key], value), text)
    : setJsoncValue(text, path, fields);
