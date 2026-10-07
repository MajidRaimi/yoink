import { cn } from "@/lib/utils";

type CommandRow = {
  command: string;
  aliases?: string[];
  description: string;
};

const commands: CommandRow[] = [
  { command: "yoink", description: "Open the interactive account menu" },
  { command: "yoink <name>", description: "Switch straight to a saved profile" },
  {
    command: "yoink add",
    aliases: ["login"],
    description: "Add a Claude, Codex, Kimi, Gemini or Copilot login, or an API-key provider",
  },
  {
    command: "yoink edit <name>",
    description: "Edit a profile: name, or a provider's harnesses / models / key / endpoints",
  },
  { command: "yoink save <name>", description: "Snapshot your current login as a profile (--tool <tool> for other CLIs)" },
  { command: "yoink use <name>", aliases: ["switch"], description: "Switch to a saved profile in the tool it belongs to (--force if it is running)" },
  { command: "yoink connect <name>", description: "Connect a provider to harnesses (--to pi,opencode,qwen)" },
  { command: "yoink disconnect <name>", description: "Remove a provider from harnesses (--from codex)" },
  { command: "yoink models <name>", description: "Choose a provider's models, then re-sync (--set a,b)" },
  { command: "yoink harnesses", description: "Show detected harnesses and their providers (--json)" },
  { command: "yoink import", description: "Import providers already in your harness configs (--yes)" },
  {
    command: "yoink status <name>",
    description: "Show each harness for a provider: installed, compatible, connected (--json)",
  },
  { command: "yoink presets", description: "List the built-in provider presets (--json)" },
  {
    command: "yoink probe",
    description: "Detect a provider's endpoints and models (--base-url or --preset, key on stdin, --json)",
  },
  { command: "yoink list", aliases: ["ls", "accounts"], description: "List all saved profiles (--json)" },
  { command: "yoink current", aliases: ["who"], description: "Show the active profiles (--tool, --json)" },
  { command: "yoink rename <a> <b>", description: "Rename a profile" },
  { command: "yoink remove <name>", aliases: ["rm"], description: "Delete a profile" },
  { command: "yoink help", aliases: ["-h", "--help"], description: "Show help" },
  { command: "yoink version", aliases: ["-v", "--version"], description: "Show the version" },
];

export const CommandTable = () => (
  <div className="overflow-hidden rounded-xl border border-hairline">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-hairline bg-surface text-left font-mono text-xs text-faint">
          <th className="px-4 py-3 font-normal">command</th>
          <th className="px-4 py-3 font-normal">aliases</th>
          <th className="px-4 py-3 font-normal">does</th>
        </tr>
      </thead>
      <tbody>
        {commands.map((row, index) => (
          <tr
            key={row.command}
            className={cn("transition-colors hover:bg-surface", index < commands.length - 1 && "border-b border-hairline")}
          >
            <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">
              {row.command}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-faint">
              {row.aliases?.join(", ") ?? "·"}
            </td>
            <td className="px-4 py-3 text-muted">{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
