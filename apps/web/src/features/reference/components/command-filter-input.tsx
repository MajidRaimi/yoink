"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

export type CommandFilterInputProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  resultLabel: ReactNode;
};

export const CommandFilterInput = ({
  query,
  onQueryChange,
  onClear,
  resultLabel,
}: CommandFilterInputProps): React.JSX.Element => (
  <div role="search" className="flex flex-col gap-2">
    <label htmlFor="command-filter" className="text-sm font-medium">
      Filter commands
    </label>
    <div className="flex h-11 items-center gap-2 rounded-md border border-hairline-strong bg-surface pr-1 pl-3 focus-within:focus-ring">
      <Icon icon={MagnifyingGlassIcon} size={18} className="text-muted" />
      <input
        id="command-filter"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClear();
        }}
        placeholder="connect, --json, alias rm"
        autoComplete="off"
        spellCheck={false}
        aria-describedby="command-filter-result"
        className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm tracking-mono text-foreground outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
      />
      {query.length === 0 ? null : (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear filter"
          className="grid size-9 place-items-center rounded-sm text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring"
        >
          <Icon icon={XIcon} size={16} />
        </button>
      )}
    </div>
    <p id="command-filter-result" role="status" aria-live="polite" className="text-sm text-muted">
      {resultLabel}
    </p>
  </div>
);
