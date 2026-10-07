import { YoinkError } from "../shared/errors";
import { isSubscriptionTool } from "../features/profiles/subscription-profile";
import { SUBSCRIPTION_TOOLS, type SubscriptionTool } from "../features/profiles/types";
import { JSON_SWITCH } from "./json-output";
import { parseRawFlags } from "./provider-flags";

export type AccountTool = "claude" | SubscriptionTool;

export type SaveArgs = { name: string; tool: AccountTool };

export type UseArgs = { name: string; force: boolean };

export type ListArgs = { json: boolean };

export type CurrentArgs = { tool?: AccountTool; json: boolean };

const TOOL_FLAG = "--tool";
const FORCE_SWITCH = "--force";
const ACCOUNT_TOOLS: readonly AccountTool[] = ["claude", ...SUBSCRIPTION_TOOLS];

export const parseAccountTool = (raw: string): AccountTool => {
  const value = raw.trim().toLowerCase();
  if (value === "claude" || isSubscriptionTool(value)) return value;
  throw new YoinkError(`Unknown tool "${raw}". Use one of: ${ACCOUNT_TOOLS.join(", ")}.`);
};

const leadingName = (args: readonly string[], usage: string): string => {
  const name = args[0]?.trim();
  if (!name || name.startsWith("--")) throw new YoinkError(`Usage: ${usage}`);
  return name;
};

export const parseSaveArgs = (args: readonly string[]): SaveArgs => {
  const name = leadingName(args, "yoink save <name> [--tool <tool>]");
  const { values } = parseRawFlags(args.slice(1), new Set([TOOL_FLAG]), new Set());
  const tool = values.get(TOOL_FLAG);
  return { name, tool: tool === undefined ? "claude" : parseAccountTool(tool) };
};

export const parseUseArgs = (args: readonly string[]): UseArgs => {
  const name = leadingName(args, "yoink use <name> [--force]");
  const { switches } = parseRawFlags(args.slice(1), new Set(), new Set([FORCE_SWITCH]));
  return { name, force: switches.has(FORCE_SWITCH) };
};

export const parseListArgs = (args: readonly string[]): ListArgs => {
  const { switches } = parseRawFlags(args, new Set(), new Set([JSON_SWITCH]));
  return { json: switches.has(JSON_SWITCH) };
};

export const parseCurrentArgs = (args: readonly string[]): CurrentArgs => {
  const { values, switches } = parseRawFlags(args, new Set([TOOL_FLAG]), new Set([JSON_SWITCH]));
  const tool = values.get(TOOL_FLAG);
  return { tool: tool === undefined ? undefined : parseAccountTool(tool), json: switches.has(JSON_SWITCH) };
};
