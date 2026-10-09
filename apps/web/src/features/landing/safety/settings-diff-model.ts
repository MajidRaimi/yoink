export const MANAGED_ENV_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
] as const;

export type ManagedEnvKey = (typeof MANAGED_ENV_KEYS)[number];

export type DiffMode = "apply" | "strip";

export type LineChange = "context" | "added" | "removed";

export type DiffLine = {
  id: string;
  depth: number;
  text: string;
  comma: boolean;
  change: LineChange;
  ownedBy: "user" | "yoink" | "json";
};

export const SETTINGS_PATH = "~/.claude/settings.json";

const SAMPLE_BASE_URL = "https://openrouter.ai/api";
const SAMPLE_TOKEN = "sk-or-v1-****";
const SAMPLE_MODEL = "moonshotai/kimi-k2";

const managedValue = (key: ManagedEnvKey): string => {
  if (key === "ANTHROPIC_BASE_URL") return SAMPLE_BASE_URL;
  if (key === "ANTHROPIC_AUTH_TOKEN") return SAMPLE_TOKEN;
  return SAMPLE_MODEL;
};

const entry = (key: string, value: string): string => `${JSON.stringify(key)}: ${JSON.stringify(value)}`;

const line = (id: string, depth: number, text: string, ownedBy: DiffLine["ownedBy"], comma = false): DiffLine => ({
  id,
  depth,
  text,
  comma,
  change: "context",
  ownedBy,
});

export type DiffInput = {
  mode: DiffMode;
  tracked: boolean;
};

export const writesManagedKeys = ({ mode, tracked }: DiffInput): boolean => mode === "strip" || !tracked;

export const settingsDiff = (input: DiffInput): DiffLine[] => {
  const showManaged = writesManagedKeys(input);
  const managedChange: LineChange = input.mode === "apply" ? "added" : "removed";
  const userEnvComma = showManaged && input.mode === "apply";
  const managed = showManaged
    ? MANAGED_ENV_KEYS.map(
        (key, index): DiffLine => ({
          ...line(key, 2, entry(key, managedValue(key)), "yoink", index < MANAGED_ENV_KEYS.length - 1),
          change: managedChange,
        }),
      )
    : [];
  return [
    line("open", 0, "{", "json"),
    line("permissions", 1, `"permissions": { "allow": ["Bash(git status)"] }`, "user", true),
    line("co-authored", 1, `"includeCoAuthoredBy": false`, "user", true),
    line("env-open", 1, `"env": {`, "json"),
    line("DISABLE_TELEMETRY", 2, entry("DISABLE_TELEMETRY", "1"), "user", userEnvComma),
    ...managed,
    line("env-close", 1, "}", "json"),
    line("close", 0, "}", "json"),
  ];
};

export const diffSummary = (lines: readonly DiffLine[]): string => {
  const added = lines.filter((candidate) => candidate.change === "added").length;
  const removed = lines.filter((candidate) => candidate.change === "removed").length;
  const userKeys = lines.filter((candidate) => candidate.ownedBy === "user").length;
  const kept = `${userKeys} of your keys unchanged.`;
  if (added > 0) return `${added} managed keys added. ${kept}`;
  if (removed > 0) return `${removed} managed keys removed. ${kept}`;
  return `Nothing written. ${kept}`;
};

export const TRACKED_WARNING = `${SETTINGS_PATH} is tracked in a git repo on this machine, so your API key could be committed. Write anyway?`;

export const TRACKED_SKIPPED = "Skipped because its config is tracked in git.";
