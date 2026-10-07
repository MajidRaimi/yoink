import { expect, test } from "bun:test";
import { parseYamlDocument } from "../src/features/harnesses/adapters/yaml-document";
import { ConfigParseError } from "../src/shared/errors";

const path = "/scratch/models.yml";
const secret = "FAKEKEY-yaml-0123456789";

const parseErrorMessage = (text: string): string => {
  try {
    parseYamlDocument(path, text);
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigParseError);
    return (error as ConfigParseError).message;
  }
  throw new Error("expected a parse error");
};

test("parseYamlDocument reports the error position without echoing the source line", () => {
  const message = parseErrorMessage(`providers:\n  fuse:\n    apiKey: ${secret}: oops\n`);
  expect(message).not.toContain(secret);
  expect(message).not.toContain("apiKey");
  expect(message).toContain(path);
  expect(message).toContain("line 3");
});

test("parseYamlDocument hides secrets in unterminated quoted scalars", () => {
  const message = parseErrorMessage(`providers:\n  fuse:\n    apiKey: "${secret}\n`);
  expect(message).not.toContain(secret);
});

test("parseYamlDocument still parses valid documents", () => {
  const document = parseYamlDocument(path, "providers:\n  fuse:\n    apiKey: value\n");
  expect(document.getIn(["providers", "fuse", "apiKey"])).toBe("value");
});
