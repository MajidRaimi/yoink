import type { CommandFlag } from "../commands";

export type CommandFlagsProps = {
  flags: readonly CommandFlag[];
};

export const CommandFlags = ({ flags }: CommandFlagsProps): React.JSX.Element => (
  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
    {flags.map((flag) => (
      <div key={flag.flag} className="contents">
        <dt className="font-mono tracking-mono break-words text-foreground sm:whitespace-nowrap">
          {flag.flag}
          {flag.value === undefined ? null : <span className="text-muted"> {flag.value}</span>}
        </dt>
        <dd className="mb-2 text-muted sm:mb-0">{flag.description}</dd>
      </div>
    ))}
  </dl>
);
