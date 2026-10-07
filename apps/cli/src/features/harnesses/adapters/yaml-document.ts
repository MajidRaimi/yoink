import { LineCounter, parseDocument, type Document, type YAMLError } from "yaml";
import { ConfigParseError } from "../../../shared/errors";
import { readOptionalText } from "../../../shared/fs-errors";
import { writeConfigFile } from "./config-file";

const describeYamlError = (error: YAMLError, lineCounter: LineCounter): string => {
  const { line, col } = lineCounter.linePos(error.pos[0]);
  return `YAML syntax error ${error.code} at line ${line}, column ${col}`;
};

export const parseYamlDocument = (path: string, text: string): Document => {
  const lineCounter = new LineCounter();
  const document = parseDocument(text, { prettyErrors: false, lineCounter });
  const [firstError] = document.errors;
  if (firstError) throw new ConfigParseError(path, new Error(describeYamlError(firstError, lineCounter)));
  return document;
};

export const readYamlDocument = async (path: string): Promise<Document | null> => {
  const text = await readOptionalText(path);
  return text === null ? null : parseYamlDocument(path, text);
};

export const loadYamlDocument = async (path: string): Promise<Document> =>
  (await readYamlDocument(path)) ?? parseYamlDocument(path, "");

export const writeYamlDocument = (path: string, document: Document): Promise<void> =>
  writeConfigFile(path, String(document));
