import { YoinkError } from "../shared/errors";
import { validateHttpUrl } from "../shared/validators";
import { ALLOW_TRACKED_SWITCH } from "../features/harnesses/tracked-guard";
import { HARNESS_IDS, PROTOCOLS, type Endpoint, type HarnessId, type Protocol } from "../features/profiles/types";

export type ProviderAddArgs = {
  name: string;
  preset?: string;
  baseUrl?: string;
  displayName?: string;
  protocols: Protocol[];
  endpoints: Endpoint[];
  models: string[];
  connect: HarnessId[];
  defaultModel?: string;
  tokenFromStdin: boolean;
  allowTracked: boolean;
};

const PROVIDER_ADD_VALUE_FLAGS = new Set([
  "--name",
  "--preset",
  "--base-url",
  "--provider",
  "--protocol",
  "--endpoint",
  "--models",
  "--model",
  "--connect",
  "--default",
]);

const PROVIDER_ONLY_FLAGS = ["--preset", "--models", "--connect", "--default", "--protocol", "--endpoint"];

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

const parseProtocolList = (value: string | undefined): Protocol[] => splitList(value).map(parseProtocol);

const parseProtocol = (value: string): Protocol => {
  if (!isProtocol(value)) throw new YoinkError(`Unknown protocol "${value}". Use one of: ${PROTOCOLS.join(", ")}.`);
  return value;
};

const parseEndpoint = (entry: string): Endpoint => {
  const separator = entry.indexOf("=");
  if (separator <= 0) throw new YoinkError(`Invalid --endpoint "${entry}". Use <protocol>=<url>.`);
  const protocol = parseProtocol(entry.slice(0, separator).trim());
  const baseUrl = entry.slice(separator + 1).trim();
  const error = validateHttpUrl(baseUrl);
  if (error) throw new YoinkError(`Invalid --endpoint url for ${protocol}: ${error}`);
  return { protocol, baseUrl };
};

const parseEndpointList = (value: string | undefined): Endpoint[] => {
  const endpoints = splitList(value).map(parseEndpoint);
  const protocols = endpoints.map((endpoint) => endpoint.protocol);
  const duplicate = protocols.find((protocol, index) => protocols.indexOf(protocol) !== index);
  if (duplicate) throw new YoinkError(`Protocol ${duplicate} is listed more than once in --endpoint.`);
  return endpoints;
};

export const isProviderAddInvocation = (args: readonly string[]): boolean =>
  args.some((arg) => PROVIDER_ONLY_FLAGS.includes(arg));

export const parseProviderAddArgs = (args: readonly string[]): ProviderAddArgs => {
  const { values, switches } = parseRawFlags(args, PROVIDER_ADD_VALUE_FLAGS, new Set(["--external", "--token-stdin", ALLOW_TRACKED_SWITCH]));
  const name = values.get("--name");
  if (!name) throw new YoinkError("Missing required flag --name.");
  const preset = values.get("--preset");
  const baseUrl = values.get("--base-url");
  const endpoints = parseEndpointList(values.get("--endpoint"));
  if (!preset && !baseUrl && endpoints.length === 0) {
    throw new YoinkError("Pass --preset <id>, --base-url <url> or --endpoint <protocol>=<url>.");
  }
  if (endpoints.length > 0 && preset) throw new YoinkError("Pass either --preset or --endpoint, not both.");
  if (endpoints.length > 0 && values.has("--protocol")) throw new YoinkError("Pass either --protocol or --endpoint, not both.");
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
    endpoints,
    models,
    connect: parseHarnessList(values.get("--connect")),
    defaultModel: values.get("--default"),
    tokenFromStdin: switches.has("--token-stdin"),
    allowTracked: switches.has(ALLOW_TRACKED_SWITCH),
  };
};
