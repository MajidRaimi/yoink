import { type CommandIndexEntry, matchesTerms, queryTerms } from "./command-query";

export const COMMAND_GROUPS = [
  { id: "accounts", title: "Accounts", summary: "Open the menu, add, switch, list and manage saved profiles." },
  {
    id: "providers",
    title: "Providers and harnesses",
    summary: "Store an API key once and keep it in sync across the harnesses you connect.",
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    summary: "Save and inspect ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins with --tool.",
  },
  { id: "info", title: "Info", summary: "Help and version output." },
] as const;

export type CommandGroupId = (typeof COMMAND_GROUPS)[number]["id"];

export type CommandGroup = (typeof COMMAND_GROUPS)[number];

export type CommandFlag = {
  readonly flag: string;
  readonly value?: string;
  readonly description: string;
};

export type CliCommand = {
  readonly id: string;
  readonly name: string | null;
  readonly usage: string;
  readonly aliases: readonly string[];
  readonly summary: string;
  readonly flags: readonly CommandFlag[];
  readonly example: string;
  readonly group: CommandGroupId;
};

const TOKEN_STDIN: CommandFlag = { flag: "--token-stdin", description: "Read the API key from stdin, so it never lands in shell history." };

const JSON_FLAG: CommandFlag = { flag: "--json", description: "Print machine-readable JSON for scripts." };

const ALLOW_TRACKED: CommandFlag = {
  flag: "--allow-tracked",
  description: "Write the key into a harness config even when that file is tracked in a git repository.",
};

export const CLI_COMMANDS: readonly CliCommand[] = [
  {
    id: "menu",
    name: null,
    usage: "yoink",
    aliases: [],
    summary: "Open the interactive account menu, grouped by tool.",
    flags: [],
    example: "yoink",
    group: "accounts",
  },
  {
    id: "switch-shorthand",
    name: null,
    usage: "yoink <name>",
    aliases: [],
    summary: "Switch straight to a saved profile. Any unrecognized argument is treated as a profile name.",
    flags: [],
    example: "yoink work",
    group: "accounts",
  },
  {
    id: "add",
    name: "add",
    usage: "yoink add",
    aliases: ["login"],
    summary:
      "Add a Claude account, a Codex, Kimi, Gemini or Copilot login, or an API-key provider. Interactive unless provider flags are passed.",
    flags: [
      { flag: "--external", description: "Add a provider without prompts." },
      { flag: "--name", value: "<id>", description: "Profile id for the provider." },
      { flag: "--preset", value: "<p>", description: "Use a built-in preset's endpoints." },
      { flag: "--base-url", value: "<u>", description: "Base URL of a custom provider." },
      { flag: "--protocol", value: "<p,...>", description: "Protocols the base URL speaks." },
      { flag: "--endpoint", value: "<p>=<url>,...", description: "One base URL per protocol, instead of --base-url." },
      { flag: "--models", value: "<m,...>", description: "Models the provider exposes." },
      { flag: "--connect", value: "<h,...>", description: "Harnesses to connect right away." },
      { flag: "--default", value: "<m>", description: "Default model in the connected harnesses." },
      { flag: "--provider", value: "<p>", description: "Display name of the provider." },
      { flag: "--model", value: "<m>", description: "Single model, for the legacy Claude Code provider form." },
      TOKEN_STDIN,
      ALLOW_TRACKED,
    ],
    example:
      'echo "$FUSE_API_KEY" | yoink add --external --name fuse --base-url https://api.fuse.example/v1 --models claude-sonnet-4-5 --connect pi,opencode --token-stdin',
    group: "accounts",
  },
  {
    id: "edit",
    name: "edit",
    usage: "yoink edit <name>",
    aliases: [],
    summary:
      "Edit a profile: rename a Claude account, or change a provider's harnesses, models, id, display name, API key or endpoints.",
    flags: [
      { flag: "--name", value: "<n>", description: "New profile id." },
      { flag: "--provider", value: "<p>", description: "New display name." },
      { flag: "--base-url", value: "<u>", description: "New base URL." },
      { flag: "--model", value: "<m>", description: "New model." },
      TOKEN_STDIN,
    ],
    example: "yoink edit fuse --name fuse-work",
    group: "accounts",
  },
  {
    id: "use",
    name: "use",
    usage: "yoink use <name>",
    aliases: ["switch"],
    summary:
      "Switch to a saved profile inside its own tool. If the tool is running it asks first, and from a script it refuses a subscription switch unless --force. No-ops if already active.",
    flags: [{ flag: "--force", description: "Switch even when the tool is running." }],
    example: "yoink use personal",
    group: "accounts",
  },
  {
    id: "list",
    name: "list",
    usage: "yoink list",
    aliases: ["ls", "accounts"],
    summary: "List all saved profiles grouped by tool, marking the active one in each group.",
    flags: [JSON_FLAG],
    example: "yoink list --json",
    group: "accounts",
  },
  {
    id: "rename",
    name: "rename",
    usage: "yoink rename <a> <b>",
    aliases: [],
    summary: "Rename a profile. A provider is renamed in every harness too.",
    flags: [],
    example: "yoink rename temp scratch",
    group: "accounts",
  },
  {
    id: "remove",
    name: "remove",
    usage: "yoink remove <name>",
    aliases: ["rm"],
    summary: "Delete a profile. A provider is disconnected from every harness first.",
    flags: [],
    example: "yoink remove scratch",
    group: "accounts",
  },
  {
    id: "connect",
    name: "connect",
    usage: "yoink connect <name>",
    aliases: [],
    summary: "Connect a provider to harnesses. Without --to it opens a picker.",
    flags: [
      { flag: "--to", value: "<h,...>", description: "Harness ids to connect, skipping the picker." },
      { flag: "--default", value: "<m>", description: "Default model in those harnesses." },
      ALLOW_TRACKED,
    ],
    example: "yoink connect fuse --to omp",
    group: "providers",
  },
  {
    id: "disconnect",
    name: "disconnect",
    usage: "yoink disconnect <name>",
    aliases: [],
    summary: "Remove a provider from harnesses, or from every harness it is in.",
    flags: [{ flag: "--from", value: "<h,...>", description: "Harness ids to disconnect from." }],
    example: "yoink disconnect fuse --from opencode",
    group: "providers",
  },
  {
    id: "models",
    name: "models",
    usage: "yoink models <name>",
    aliases: [],
    summary: "Choose which models a provider exposes, then re-sync its harnesses.",
    flags: [{ flag: "--set", value: "<m,...>", description: "Model ids to keep, skipping the picker." }],
    example: "yoink models fuse --set claude-sonnet-4-5,gpt-5.2",
    group: "providers",
  },
  {
    id: "harnesses",
    name: "harnesses",
    usage: "yoink harnesses",
    aliases: [],
    summary: "Show detected harnesses, their config paths and their providers.",
    flags: [JSON_FLAG],
    example: "yoink harnesses --json",
    group: "providers",
  },
  {
    id: "import",
    name: "import",
    usage: "yoink import",
    aliases: [],
    summary: "Import providers already configured in your harnesses.",
    flags: [{ flag: "--yes", description: "Import without prompting." }],
    example: "yoink import --yes",
    group: "providers",
  },
  {
    id: "status",
    name: "status",
    usage: "yoink status <name>",
    aliases: [],
    summary: "Show each harness for a provider: installed, compatible and connected.",
    flags: [JSON_FLAG],
    example: "yoink status fuse",
    group: "providers",
  },
  {
    id: "presets",
    name: "presets",
    usage: "yoink presets",
    aliases: [],
    summary: "List the built-in provider presets.",
    flags: [JSON_FLAG],
    example: "yoink presets --json",
    group: "providers",
  },
  {
    id: "probe",
    name: "probe",
    usage: "yoink probe",
    aliases: [],
    summary: "Detect a provider's endpoints and models, with the API key on stdin.",
    flags: [
      { flag: "--base-url", value: "<u>", description: "Base URL to probe." },
      { flag: "--preset", value: "<p>", description: "Preset to probe instead of a base URL." },
      TOKEN_STDIN,
      JSON_FLAG,
    ],
    example: 'echo "$FUSE_API_KEY" | yoink probe --base-url https://api.fuse.example/v1 --token-stdin --json',
    group: "providers",
  },
  {
    id: "save",
    name: "save",
    usage: "yoink save <name>",
    aliases: [],
    summary: "Snapshot the current live login as a profile. Claude Code by default, another tool with --tool.",
    flags: [{ flag: "--tool", value: "<tool>", description: "Tool whose login to snapshot." }],
    example: "yoink save codex-work --tool codex",
    group: "subscriptions",
  },
  {
    id: "current",
    name: "current",
    usage: "yoink current",
    aliases: ["who"],
    summary: "Show the active profile for Claude Code and each subscription tool.",
    flags: [{ flag: "--tool", value: "<tool>", description: "Show one tool only." }, JSON_FLAG],
    example: "yoink current --tool gemini",
    group: "subscriptions",
  },
  {
    id: "help",
    name: "help",
    usage: "yoink help",
    aliases: ["-h", "--help"],
    summary: "Print help.",
    flags: [],
    example: "yoink help",
    group: "info",
  },
  {
    id: "version",
    name: "version",
    usage: "yoink version",
    aliases: ["-v", "--version"],
    summary: "Print the version.",
    flags: [],
    example: "yoink version",
    group: "info",
  },
];

export const commandsInGroup = (commands: readonly CliCommand[], group: CommandGroupId): readonly CliCommand[] =>
  commands.filter((command) => command.group === group);

export const commandAnchor = (command: CliCommand): string => `cmd-${command.id}`;

export const commandSearchText = (command: CliCommand): string =>
  [command.usage, command.summary, command.example, ...command.aliases, ...(command.aliases.length > 0 ? ["alias"] : []), ...command.flags.flatMap((flag) => [flag.flag, flag.description])]
    .join(" ")
    .toLowerCase();

export const commandIndex = (commands: readonly CliCommand[]): readonly CommandIndexEntry[] =>
  commands.map((command) => ({ id: command.id, group: command.group, text: commandSearchText(command) }));

export const filterCommands = (commands: readonly CliCommand[], query: string): readonly CliCommand[] => {
  const terms = queryTerms(query);
  if (terms.length === 0) return commands;
  return commands.filter((command) => matchesTerms(commandSearchText(command), terms));
};
