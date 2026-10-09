import { TERMINAL_COMMANDS } from "@/features/landing/surfaces/terminal-command-list";

export const TerminalCommands = (): React.JSX.Element => (
  <figure className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-hairline-strong bg-background shadow-2">
    <figcaption className="border-b border-hairline px-4 py-3 text-xs text-muted">
      The same profiles, from any shell
    </figcaption>
    <ul className="flex flex-col py-2 font-mono text-[0.8125rem] leading-relaxed">
      {TERMINAL_COMMANDS.map((entry) => (
        <li key={entry.command} className="flex flex-col gap-0.5 px-4 py-2 sm:flex-row sm:items-baseline sm:gap-6">
          <code className="shrink-0 text-foreground sm:w-40">
            <span aria-hidden="true" className="select-none text-faint">
              ${" "}
            </span>
            <bdi>{entry.command}</bdi>
          </code>
          <span className="font-sans text-sm text-muted">{entry.what}</span>
        </li>
      ))}
    </ul>
  </figure>
);
