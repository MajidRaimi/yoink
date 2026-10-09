"use client";

import { CLI_COMMANDS, COMMAND_GROUPS, commandsInGroup, type CliCommand, type CommandGroup } from "../commands";
import { useCommandFilter } from "../hooks/use-command-filter";
import { CommandCard } from "./command-card";
import { CommandFilterInput } from "./command-filter-input";
import { SectionHeading } from "./section-heading";

const resultLabelFor = (matches: number, total: number, isFiltering: boolean): React.JSX.Element => {
  if (!isFiltering) {
    return (
      <>
        <bdi>{total}</bdi> commands
      </>
    );
  }
  if (matches === 0) return <>No commands match</>;
  return (
    <>
      <bdi>{matches}</bdi> of <bdi>{total}</bdi> commands
    </>
  );
};

type CommandGroupSectionProps = {
  group: CommandGroup;
  commands: readonly CliCommand[];
};

const CommandGroupSection = ({ group, commands }: CommandGroupSectionProps): React.JSX.Element => (
  <section aria-labelledby={group.id}>
    <SectionHeading id={group.id} title={group.title}>
      {group.summary}
    </SectionHeading>
    {commands.length === 0 ? (
      <p className="border-t border-hairline pt-4 text-sm text-muted">No matching commands</p>
    ) : (
      <div className="divide-y divide-hairline border-t border-hairline">
        {commands.map((command) => (
          <CommandCard key={command.id} command={command} />
        ))}
      </div>
    )}
  </section>
);

export const CommandBrowser = (): React.JSX.Element => {
  const { query, setQuery, clear, matches, isFiltering } = useCommandFilter(CLI_COMMANDS);
  const groupedMatches = COMMAND_GROUPS.map((group) => ({ group, commands: commandsInGroup(matches, group.id) }));

  return (
    <div className="flex flex-col gap-14">
      <CommandFilterInput
        query={query}
        onQueryChange={setQuery}
        onClear={clear}
        resultLabel={resultLabelFor(matches.length, CLI_COMMANDS.length, isFiltering)}
      />
      {groupedMatches.map(({ group, commands }) => (
        <CommandGroupSection key={group.id} group={group} commands={commands} />
      ))}
    </div>
  );
};
