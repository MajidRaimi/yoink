import pc from "picocolors";
import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import { providerHarnessStatuses, type ProviderHarnessStatus } from "../features/harnesses/provider-status";
import { discoverProvider, presetSummaries, type DiscoveryTarget } from "../features/providers/discovery";
import type { ProbeResult } from "../features/providers/types";
import { parseRawFlags } from "./provider-flags";
import { formatHarnessLine, JSON_SWITCH, printJson } from "./json-output";
import { readTokenFromStdin } from "./stdin-token";

const discoveryTarget = (values: ReadonlyMap<string, string>): DiscoveryTarget => {
  const presetId = values.get("--preset");
  const baseUrl = values.get("--base-url");
  if (presetId && baseUrl) throw new YoinkError("Pass either --preset or --base-url, not both.");
  if (presetId) return { kind: "preset", presetId };
  if (baseUrl) return { kind: "base-url", baseUrl };
  throw new YoinkError("Usage: yoink probe (--base-url <url> | --preset <id>) --token-stdin [--json]");
};

const printProbe = (result: ProbeResult): void => {
  for (const endpoint of result.endpoints) {
    console.log(`${theme.success("✔")} ${pc.bold(endpoint.protocol.padEnd(20))} ${pc.dim(endpoint.baseUrl)}`);
  }
  console.log(pc.dim(`${result.models.length} model(s): ${result.models.map((model) => model.id).join(", ")}`));
};

const statusState = (status: ProviderHarnessStatus): string => {
  if (!status.installed) return pc.dim("not installed");
  if (status.parseError !== null) return theme.warn(`config unreadable: ${status.parseError}`);
  if (!status.compatible) return pc.dim("incompatible");
  if (!status.connected) return pc.dim("available");
  return theme.accent(status.defaultModel ? `connected · ${status.defaultModel}` : "connected");
};

const statusLine = (status: ProviderHarnessStatus): string =>
  formatHarnessLine({
    active: status.connected,
    label: status.label,
    state: statusState(status),
    configPath: status.configPath,
  });

export const handlePresets = (args: string[]): void => {
  const { switches } = parseRawFlags(args, new Set(), new Set([JSON_SWITCH]));
  const presets = presetSummaries();
  if (switches.has(JSON_SWITCH)) {
    printJson(presets);
    return;
  }
  for (const preset of presets) {
    const protocols = preset.endpoints.map((endpoint) => endpoint.protocol).join(", ");
    console.log(`${pc.bold(preset.id.padEnd(12))} ${preset.label.padEnd(16)} ${pc.dim(protocols)}`);
  }
};

export const handleProbe = async (args: string[]): Promise<void> => {
  const { values, switches } = parseRawFlags(
    args,
    new Set(["--base-url", "--preset"]),
    new Set([JSON_SWITCH, "--token-stdin"]),
  );
  const target = discoveryTarget(values);
  if (!switches.has("--token-stdin")) throw new YoinkError("An API key is required. Pipe it on stdin with --token-stdin.");
  const result = await discoverProvider(target, await readTokenFromStdin());
  if (switches.has(JSON_SWITCH)) {
    printJson(result);
    return;
  }
  printProbe(result);
};

export const handleStatus = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name || name.startsWith("--")) throw new YoinkError("Usage: yoink status <name> [--json]");
  const { switches } = parseRawFlags(args.slice(1), new Set(), new Set([JSON_SWITCH]));
  const statuses = await providerHarnessStatuses(name);
  if (switches.has(JSON_SWITCH)) {
    printJson(statuses);
    return;
  }
  for (const status of statuses) console.log(statusLine(status));
};
