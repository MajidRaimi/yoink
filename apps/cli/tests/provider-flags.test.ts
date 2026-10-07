import { expect, test } from "bun:test";
import {
  isProviderAddInvocation,
  parseHarnessList,
  parseProviderAddArgs,
  parseRawFlags,
  splitList,
} from "../src/cli/provider-flags";

test("isProviderAddInvocation only triggers on provider-only flags", () => {
  expect(isProviderAddInvocation(["--external", "--name", "x", "--models", "a"])).toBe(true);
  expect(isProviderAddInvocation(["--external", "--preset", "openai"])).toBe(true);
  expect(isProviderAddInvocation(["--external", "--name", "x", "--provider", "P", "--base-url", "https://x", "--model", "m"])).toBe(false);
});

test("parseProviderAddArgs parses a preset invocation", () => {
  const parsed = parseProviderAddArgs([
    "--external",
    "--name",
    "kimi",
    "--preset",
    "kimi-code",
    "--models",
    "kimi-k3, kimi-k2.7-code",
    "--connect",
    "pi,opencode",
    "--default",
    "kimi-k3",
    "--token-stdin",
  ]);
  expect(parsed).toEqual({
    name: "kimi",
    preset: "kimi-code",
    baseUrl: undefined,
    displayName: undefined,
    protocols: [],
    models: ["kimi-k3", "kimi-k2.7-code"],
    connect: ["pi", "opencode"],
    defaultModel: "kimi-k3",
    tokenFromStdin: true,
  });
});

test("parseProviderAddArgs accepts a custom base url with explicit protocols", () => {
  const parsed = parseProviderAddArgs([
    "--name",
    "fuse",
    "--base-url",
    "https://api.example.com/v1",
    "--protocol",
    "openai-chat",
    "--models",
    "m1",
  ]);
  expect(parsed.baseUrl).toBe("https://api.example.com/v1");
  expect(parsed.protocols).toEqual(["openai-chat"]);
});

test("parseProviderAddArgs rejects missing source, models and bad values", () => {
  expect(() => parseProviderAddArgs(["--name", "x", "--models", "m"])).toThrow("--preset <id> or --base-url <url>");
  expect(() => parseProviderAddArgs(["--name", "x", "--preset", "openai"])).toThrow("--models");
  expect(() => parseProviderAddArgs(["--name", "x", "--base-url", "ftp://x", "--models", "m"])).toThrow("Invalid --base-url");
  expect(() => parseProviderAddArgs(["--name", "x", "--preset", "p", "--models", "m", "--protocol", "grpc"])).toThrow(
    'Unknown protocol "grpc"',
  );
});

test("parseHarnessList validates harness ids", () => {
  expect(parseHarnessList("pi, codex")).toEqual(["pi", "codex"]);
  expect(parseHarnessList(undefined)).toEqual([]);
  expect(() => parseHarnessList("cursor")).toThrow('Unknown harness "cursor"');
});

test("parseRawFlags separates switches and values and rejects unknown flags", () => {
  const { values, switches } = parseRawFlags(["--to", "pi", "--json"], new Set(["--to"]), new Set(["--json"]));
  expect(values.get("--to")).toBe("pi");
  expect(switches.has("--json")).toBe(true);
  expect(() => parseRawFlags(["--wat"], new Set(), new Set())).toThrow('Unknown flag "--wat".');
  expect(() => parseRawFlags(["--to"], new Set(["--to"]), new Set())).toThrow("Flag --to needs a value.");
});

test("splitList trims and drops empty entries", () => {
  expect(splitList(" a, ,b ,")).toEqual(["a", "b"]);
});
