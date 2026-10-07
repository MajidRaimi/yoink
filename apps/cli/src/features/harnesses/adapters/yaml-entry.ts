import { isDeepStrictEqual } from "node:util";
import { isMap, type Document } from "yaml";
import { asRecord, type ConfigRecord } from "./config-values";

export const setYamlEntry = (document: Document, path: readonly string[], entry: ConfigRecord): void => {
  const node = document.getIn(path, true);
  if (!isMap(node)) {
    document.setIn(path, entry);
    return;
  }
  const current = asRecord(node.toJSON());
  for (const [key, value] of Object.entries(entry)) {
    if (!isDeepStrictEqual(current[key], value)) document.setIn([...path, key], value);
  }
};
