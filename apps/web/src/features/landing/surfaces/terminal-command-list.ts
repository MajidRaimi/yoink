export type TerminalCommand = {
  command: string;
  what: string;
};

export const TERMINAL_COMMANDS: readonly TerminalCommand[] = [
  { command: "yoink", what: "Open the interactive menu" },
  { command: "yoink work", what: "Switch straight to a saved profile" },
  { command: "yoink list", what: "List saved profiles grouped by tool" },
  { command: "yoink current", what: "Show the active profile for each tool" },
  { command: "yoink add", what: "Add a login or an API-key provider" },
];
