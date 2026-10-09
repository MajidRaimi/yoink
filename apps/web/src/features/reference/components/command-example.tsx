export type CommandExampleProps = {
  command: string;
};

export const CommandExample = ({ command }: CommandExampleProps): React.JSX.Element => (
  <pre
    tabIndex={0}
    className="overflow-x-auto rounded-md border border-hairline bg-surface px-4 py-3 font-mono text-sm tracking-mono focus-visible:focus-ring"
  >
    <span aria-hidden="true" className="mr-3 select-none text-brand-text">
      $
    </span>
    <code>{command}</code>
  </pre>
);
