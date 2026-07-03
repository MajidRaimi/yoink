import { YoinkError } from "../shared/errors";
import { validateHttpUrl } from "../shared/validators";
import { normalizeBaseUrl } from "../features/provider/service";

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

const VALUE_FLAGS = {
  "--name": "name",
  "--provider": "provider",
  "--base-url": "baseUrl",
  "--model": "model",
} as const;

type ValueFlag = keyof typeof VALUE_FLAGS;
type ValueField = (typeof VALUE_FLAGS)[ValueFlag];

type ParsedFlags = {
  values: Partial<Record<ValueField, string>>;
  tokenFromStdin: boolean;
};

const isValueFlag = (arg: string): arg is ValueFlag => arg in VALUE_FLAGS;

const parseFlags = (args: string[], booleanFlags: ReadonlySet<string>): ParsedFlags => {
  const values: Partial<Record<ValueField, string>> = {};
  let tokenFromStdin = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "--token-stdin") {
      tokenFromStdin = true;
      continue;
    }
    if (booleanFlags.has(arg)) continue;
    if (!isValueFlag(arg)) throw new YoinkError(`Unknown flag "${arg}".`);
    const value = args[index + 1]?.trim();
    if (!value || value.startsWith("--")) throw new YoinkError(`Flag ${arg} needs a value.`);
    values[VALUE_FLAGS[arg]] = value;
    index++;
  }
  return { values, tokenFromStdin };
};

const requireValue = (values: ParsedFlags["values"], flag: ValueFlag): string => {
  const value = values[VALUE_FLAGS[flag]];
  if (!value) throw new YoinkError(`Missing required flag ${flag}.`);
  return value;
};

const normalizedBaseUrlOrThrow = (raw: string): string => {
  const error = validateHttpUrl(raw);
  if (error) throw new YoinkError(`Invalid --base-url: ${error}`);
  return normalizeBaseUrl(raw);
};

export const isExternalAddInvocation = (args: string[]): boolean => args.includes("--external");

export const hasExternalEditFlags = (args: string[]): boolean =>
  args.some((arg) => arg === "--token-stdin" || isValueFlag(arg));

export const parseExternalAddArgs = (args: string[]): ExternalAddArgs => {
  const { values, tokenFromStdin } = parseFlags(args, new Set(["--external"]));
  return {
    name: requireValue(values, "--name"),
    provider: requireValue(values, "--provider"),
    baseUrl: normalizedBaseUrlOrThrow(requireValue(values, "--base-url")),
    model: requireValue(values, "--model"),
    tokenFromStdin,
  };
};

export const parseExternalEditArgs = (args: string[]): ExternalEditArgs => {
  const { values, tokenFromStdin } = parseFlags(args, new Set());
  return {
    name: values.name,
    provider: values.provider,
    baseUrl: values.baseUrl === undefined ? undefined : normalizedBaseUrlOrThrow(values.baseUrl),
    model: values.model,
    tokenFromStdin,
  };
};
