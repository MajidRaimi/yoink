import { expect, test } from "bun:test";
import { parseTomlObject } from "../src/features/harnesses/adapters/toml-document";
import { ConfigParseError } from "../src/shared/errors";

const path = "/scratch/config.toml";
const secret = "FAKEKEY-toml-0123456789";

const parseErrorMessage = (text: string): string => {
  try {
    parseTomlObject(path, text);
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigParseError);
    return (error as ConfigParseError).message;
  }
  throw new Error("expected a parse error");
};

test("parseTomlObject reports a generic syntax error without echoing the offending value", () => {
  const message = parseErrorMessage(`[model_providers.fuse]\nexperimental_bearer_token = ${secret}\n`);
  expect(message).not.toContain(secret);
  expect(message).toBe(`Could not parse ${path}: TOML syntax error`);
});

test("parseTomlObject still parses valid documents", () => {
  expect(parseTomlObject(path, 'model = "x"\n')).toEqual({ model: "x" });
});
