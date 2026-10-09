import { CLI_COMMANDS, COMMAND_GROUPS, commandIndex, commandsInGroup, type CliCommand, type CommandGroup } from "../commands";
import { CommandCard } from "./command-card";
import { CommandFilterScope } from "./command-filter-scope";
import { SectionHeading } from "./section-heading";

const COMMAND_INDEX = commandIndex(CLI_COMMANDS);

type CommandGroupSectionProps = {
  group: CommandGroup;
  commands: readonly CliCommand[];
};

const CommandGroupSection = ({ group, commands }: CommandGroupSectionProps): React.JSX.Element => (
  <section aria-labelledby={group.id}>
    <SectionHeading id={group.id} title={group.title}>
      {group.summary}
    </SectionHeading>
    <div className="border-t border-hairline">
      {commands.map((command) => (
        <CommandCard key={command.id} command={command} />
      ))}
    </div>
    <p data-command-empty={group.id} className="hidden pt-4 text-sm text-muted">
      No matching commands
    </p>
  </section>
);

export const CommandBrowser = (): React.JSX.Element => (
  <CommandFilterScope index={COMMAND_INDEX}>
    {COMMAND_GROUPS.map((group) => (
      <CommandGroupSection key={group.id} group={group} commands={commandsInGroup(CLI_COMMANDS, group.id)} />
    ))}
  </CommandFilterScope>
);
