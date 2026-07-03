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
    description: "Add an account: Claude sign-in or an external provider",
  },
  {
    command: "yoink edit <name>",
    description: "Edit a profile: name, or provider / URL / key / model",
  },
  { command: "yoink save <name>", description: "Snapshot your current login as a profile" },
  { command: "yoink use <name>", aliases: ["switch"], description: "Switch to a saved profile" },
  { command: "yoink list", aliases: ["ls"], description: "List all saved profiles" },
  { command: "yoink current", aliases: ["who"], description: "Show the active profile" },
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
