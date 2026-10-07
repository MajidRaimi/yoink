import { YoinkError } from "../shared/errors";
import { validateHttpUrl } from "../shared/validators";
import { HARNESS_IDS, PROTOCOLS, type HarnessId, type Protocol } from "../features/profiles/types";

export type ProviderAddArgs = {
  name: string;
  preset?: string;
  baseUrl?: string;
  displayName?: string;
  protocols: Protocol[];
  models: string[];
  connect: HarnessId[];
  defaultModel?: string;
  tokenFromStdin: boolean;
};

const PROVIDER_ADD_VALUE_FLAGS = new Set([
  "--name",
  "--preset",
  "--base-url",
  "--provider",
  "--protocol",
  "--models",
  "--model",
  "--connect",
  "--default",
]);

const PROVIDER_ONLY_FLAGS = ["--preset", "--models", "--connect", "--default", "--protocol"];

type RawFlags = { values: Map<string, string>; switches: Set<string> };

export const parseRawFlags = (
  args: readonly string[],
  valueFlags: ReadonlySet<string>,
  switchFlags: ReadonlySet<string>,
): RawFlags => {
  const values = new Map<string, string>();
  const switches = new Set<string>();
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (switchFlags.has(arg)) {
      switches.add(arg);
      continue;
    }
    if (!valueFlags.has(arg)) throw new YoinkError(`Unknown flag "${arg}".`);
    const value = args[index + 1]?.trim();
    if (!value || value.startsWith("--")) throw new YoinkError(`Flag ${arg} needs a value.`);
    values.set(arg, value);
    index++;
  }
  return { values, switches };
};

export const splitList = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const isHarnessId = (value: string): value is HarnessId => (HARNESS_IDS as readonly string[]).includes(value);

const isProtocol = (value: string): value is Protocol => (PROTOCOLS as readonly string[]).includes(value);

export const parseHarnessList = (value: string | undefined): HarnessId[] =>
  splitList(value).map((item) => {
    if (!isHarnessId(item)) throw new YoinkError(`Unknown harness "${item}". Use one of: ${HARNESS_IDS.join(", ")}.`);
    return item;
  });

const parseProtocolList = (value: string | undefined): Protocol[] =>
  splitList(value).map((item) => {
    if (!isProtocol(item)) throw new YoinkError(`Unknown protocol "${item}". Use one of: ${PROTOCOLS.join(", ")}.`);
    return item;
  });

export const isProviderAddInvocation = (args: readonly string[]): boolean =>
  args.some((arg) => PROVIDER_ONLY_FLAGS.includes(arg));

export const parseProviderAddArgs = (args: readonly string[]): ProviderAddArgs => {
  const { values, switches } = parseRawFlags(args, PROVIDER_ADD_VALUE_FLAGS, new Set(["--external", "--token-stdin"]));
  const name = values.get("--name");
  if (!name) throw new YoinkError("Missing required flag --name.");
  const preset = values.get("--preset");
  const baseUrl = values.get("--base-url");
  if (!preset && !baseUrl) throw new YoinkError("Pass --preset <id> or --base-url <url>.");
  if (baseUrl) {
    const error = validateHttpUrl(baseUrl);
    if (error) throw new YoinkError(`Invalid --base-url: ${error}`);
  }
  const models = splitList(values.get("--models") ?? values.get("--model"));
  if (models.length === 0) throw new YoinkError("Missing required flag --models <id,id>.");
  return {
    name,
    preset,
    baseUrl,
    displayName: values.get("--provider"),
    protocols: parseProtocolList(values.get("--protocol")),
    models,
    connect: parseHarnessList(values.get("--connect")),
    defaultModel: values.get("--default"),
    tokenFromStdin: switches.has("--token-stdin"),
  };
};
