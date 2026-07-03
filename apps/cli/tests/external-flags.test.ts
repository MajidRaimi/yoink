import { expect, test } from "bun:test";
import {
  hasExternalEditFlags,
  isExternalAddInvocation,
  parseExternalAddArgs,
  parseExternalEditArgs,
} from "../src/cli/external-flags";
import { YoinkError } from "../src/shared/errors";

const fullAddArgs = [
  "--external",
  "--name",
  "work",
  "--provider",
  "OpenRouter",
  "--base-url",
  "https://openrouter.ai/api/",
  "--model",
  "glm-4.6",
];

test("parseExternalAddArgs parses a full valid invocation", () => {
  expect(parseExternalAddArgs(fullAddArgs)).toEqual({
    name: "work",
    provider: "OpenRouter",
    baseUrl: "https://openrouter.ai/api",
    model: "glm-4.6",
    tokenFromStdin: false,
  });
});

test("parseExternalAddArgs detects --token-stdin", () => {
  expect(parseExternalAddArgs([...fullAddArgs, "--token-stdin"]).tokenFromStdin).toBe(true);
});

test("parseExternalAddArgs errors when a required flag is missing", () => {
  const flags = ["--name", "--provider", "--base-url", "--model"] as const;
  for (const flag of flags) {
    const index = fullAddArgs.indexOf(flag);
    const args = [...fullAddArgs.slice(0, index), ...fullAddArgs.slice(index + 2)];
    expect(() => parseExternalAddArgs(args)).toThrow(YoinkError);
    expect(() => parseExternalAddArgs(args)).toThrow(`Missing required flag ${flag}.`);
  }
});

test("parseExternalAddArgs errors on an unknown flag", () => {
  expect(() => parseExternalAddArgs([...fullAddArgs, "--nope"])).toThrow('Unknown flag "--nope".');
});

test("parseExternalAddArgs errors when a flag has no value", () => {
  expect(() => parseExternalAddArgs(["--external", "--name"])).toThrow("Flag --name needs a value.");
  expect(() => parseExternalAddArgs(["--external", "--name", "--provider"])).toThrow(
    "Flag --name needs a value.",
  );
});

test("parseExternalAddArgs rejects a non-http base url", () => {
  const args = fullAddArgs.map((arg) => (arg === "https://openrouter.ai/api/" ? "openrouter.ai" : arg));
  expect(() => parseExternalAddArgs(args)).toThrow("Invalid --base-url");
});

test("parseExternalEditArgs parses a partial update", () => {
  expect(parseExternalEditArgs(["--model", "new-model"])).toEqual({
    name: undefined,
    provider: undefined,
    baseUrl: undefined,
    model: "new-model",
    tokenFromStdin: false,
  });
  expect(parseExternalEditArgs(["--name", "renamed", "--base-url", "https://x.example/v1/"])).toEqual({
    name: "renamed",
    provider: undefined,
    baseUrl: "https://x.example/v1",
    model: undefined,
    tokenFromStdin: false,
  });
});

test("parseExternalEditArgs detects --token-stdin alone", () => {
  const parsed = parseExternalEditArgs(["--token-stdin"]);
  expect(parsed.tokenFromStdin).toBe(true);
  expect(parsed.name).toBeUndefined();
});

test("parseExternalEditArgs errors on unknown flags", () => {
  expect(() => parseExternalEditArgs(["--external"])).toThrow('Unknown flag "--external".');
  expect(() => parseExternalEditArgs(["--model", "m", "--wat"])).toThrow('Unknown flag "--wat".');
});

test("isExternalAddInvocation detects the --external flag", () => {
  expect(isExternalAddInvocation(fullAddArgs)).toBe(true);
  expect(isExternalAddInvocation([])).toBe(false);
  expect(isExternalAddInvocation(["--name", "x"])).toBe(false);
});

test("hasExternalEditFlags detects any non-interactive edit flag", () => {
  expect(hasExternalEditFlags(["--model", "m"])).toBe(true);
  expect(hasExternalEditFlags(["--token-stdin"])).toBe(true);
  expect(hasExternalEditFlags([])).toBe(false);
  expect(hasExternalEditFlags(["extra"])).toBe(false);
});
