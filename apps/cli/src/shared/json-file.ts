import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import { ConfigParseError } from "./errors";
import { readOptionalText } from "./fs-errors";

const STRICT_JSON = { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false } as const;

const linePosition = (text: string, offset: number): { line: number; column: number } => {
  const before = text.slice(0, offset);
  return { line: before.split("\n").length, column: offset - before.lastIndexOf("\n") };
};

export const describeJsonSyntaxError = (text: string): string => {
  const errors: ParseError[] = [];
  parse(text, errors, STRICT_JSON);
  const [firstError] = errors;
  if (!firstError) return "JSON syntax error";
  const { line, column } = linePosition(text, firstError.offset);
  return `JSON syntax error ${printParseErrorCode(firstError.error)} at line ${line}, column ${column}`;
};

export const parseJsonText = <T>(path: string, text: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ConfigParseError(path, new Error(describeJsonSyntaxError(text)));
  }
};

export const readJsonFile = async <T>(path: string): Promise<T | null> => {
  const text = await readOptionalText(path);
  if (text === null || text.trim().length === 0) return null;
  return parseJsonText<T>(path, text);
};
