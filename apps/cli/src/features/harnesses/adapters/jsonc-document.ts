import { applyEdits, modify, parse, printParseErrorCode, type JSONPath, type ParseError } from "jsonc-parser";
import { ConfigParseError, YoinkError } from "../../../shared/errors";
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
