"use client";

import type { ReactNode } from "react";
import type { CommandIndexEntry } from "../command-query";
import { useCommandFilter } from "../hooks/use-command-filter";
import { commandFilterCss } from "./command-filter-css";
import { CommandFilterInput } from "./command-filter-input";

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

export type CommandFilterScopeProps = {
  index: readonly CommandIndexEntry[];
  children: ReactNode;
};

export const CommandFilterScope = ({ index, children }: CommandFilterScopeProps): React.JSX.Element => {
  const { query, setQuery, clear, matchedIds, isFiltering } = useCommandFilter(index);
  const css = commandFilterCss(index, matchedIds, isFiltering);

  return (
    <div className="flex flex-col gap-14">
      <CommandFilterInput
        query={query}
        onQueryChange={setQuery}
        onClear={clear}
        resultLabel={resultLabelFor(matchedIds.size, index.length, isFiltering)}
      />
      {css.length === 0 ? null : <style>{css}</style>}
      {children}
    </div>
  );
};
