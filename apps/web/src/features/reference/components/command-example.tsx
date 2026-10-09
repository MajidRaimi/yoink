"use client";

import { useRef } from "react";
import { useFocusableOverflow } from "./use-focusable-overflow";

export type CommandExampleProps = {
  command: string;
  label: string;
};

export const CommandExample = ({ command, label }: CommandExampleProps): React.JSX.Element => {
  const preRef = useRef<HTMLPreElement>(null);
  const overflows = useFocusableOverflow(preRef);

  return (
    <pre
      ref={preRef}
      tabIndex={overflows ? 0 : undefined}
      role={overflows ? "region" : undefined}
      aria-label={overflows ? label : undefined}
      className="overflow-x-auto rounded-md border border-hairline bg-surface px-4 py-3 font-mono text-sm tracking-mono focus-visible:focus-ring"
    >
      <span aria-hidden="true" className="mr-3 select-none text-brand-text">
        $
      </span>
      <code>{command}</code>
    </pre>
  );
};
