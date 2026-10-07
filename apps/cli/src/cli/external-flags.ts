import { YoinkError } from "../shared/errors";
import { validateHttpUrl } from "../shared/validators";
import { stripTrailingSlashes } from "../features/harnesses/endpoint";
import { parseRawFlags } from "./provider-flags";

export type ExternalAddArgs = {
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  tokenFromStdin: boolean;
};

export type ExternalEditArgs = {
  name?: string;
  provider?: string;
  baseUrl?: string;
  model?: string;
  tokenFromStdin: boolean;
};

const TOKEN_STDIN_FLAG = "--token-stdin";

const EXTERNAL_VALUE_FLAGS: ReadonlySet<string> = new Set(["--name", "--provider", "--base-url", "--model"]);

const ADD_SWITCH_FLAGS: ReadonlySet<string> = new Set(["--external", TOKEN_STDIN_FLAG]);

const EDIT_SWITCH_FLAGS: ReadonlySet<string> = new Set([TOKEN_STDIN_FLAG]);

const requireValue = (values: ReadonlyMap<string, string>, flag: string): string => {
  const value = values.get(flag);
  if (!value) throw new YoinkError(`Missing required flag ${flag}.`);
  return value;
};

const normalizedBaseUrlOrThrow = (raw: string): string => {
  const error = validateHttpUrl(raw);
  if (error) throw new YoinkError(`Invalid --base-url: ${error}`);
  return stripTrailingSlashes(raw);
};

export const isExternalAddInvocation = (args: readonly string[]): boolean => args.includes("--external");

export const hasExternalEditFlags = (args: readonly string[]): boolean =>
  args.some((arg) => EDIT_SWITCH_FLAGS.has(arg) || EXTERNAL_VALUE_FLAGS.has(arg));

export const parseExternalAddArgs = (args: readonly string[]): ExternalAddArgs => {
  const { values, switches } = parseRawFlags(args, EXTERNAL_VALUE_FLAGS, ADD_SWITCH_FLAGS);
  return {
    name: requireValue(values, "--name"),
    provider: requireValue(values, "--provider"),
    baseUrl: normalizedBaseUrlOrThrow(requireValue(values, "--base-url")),
    model: requireValue(values, "--model"),
    tokenFromStdin: switches.has(TOKEN_STDIN_FLAG),
  };
};

export const parseExternalEditArgs = (args: readonly string[]): ExternalEditArgs => {
  const { values, switches } = parseRawFlags(args, EXTERNAL_VALUE_FLAGS, EDIT_SWITCH_FLAGS);
  const baseUrl = values.get("--base-url");
  return {
    name: values.get("--name"),
    provider: values.get("--provider"),
    baseUrl: baseUrl === undefined ? undefined : normalizedBaseUrlOrThrow(baseUrl),
    model: values.get("--model"),
    tokenFromStdin: switches.has(TOKEN_STDIN_FLAG),
  };
};
