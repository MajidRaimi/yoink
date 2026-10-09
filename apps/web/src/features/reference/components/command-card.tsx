import { InlineCode } from "@/shared/ui/code";
import { commandAnchor, type CliCommand } from "../commands";
import { CommandExample } from "./command-example";
import { CommandFlags } from "./command-flags";

export type CommandCardProps = {
  command: CliCommand;
};

export const CommandCard = ({ command }: CommandCardProps): React.JSX.Element => {
  const anchor = commandAnchor(command);
  return (
    <article
      aria-labelledby={anchor}
      className="grid gap-4 py-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10"
    >
      <div className="min-w-0">
        <h3 id={anchor} className="scroll-mt-24 font-mono text-base font-medium tracking-mono">
          <a
            href={`#${anchor}`}
            className="rounded-xs break-words transition-colors dur-1 hover:text-brand-text focus-visible:focus-ring"
          >
            {command.usage}
          </a>
        </h3>
        {command.aliases.length === 0 ? null : (
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <span>Aliases</span>
            {command.aliases.map((alias) => (
              <InlineCode key={alias}>{alias}</InlineCode>
            ))}
          </p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <p>{command.summary}</p>
        {command.flags.length === 0 ? null : <CommandFlags flags={command.flags} />}
        <CommandExample command={command.example} />
      </div>
    </article>
  );
};
