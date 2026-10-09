import type { CommandGroupId } from "./commands";

export type CommandIndexEntry = {
  readonly id: string;
  readonly group: CommandGroupId;
  readonly text: string;
};

export const queryTerms = (query: string): readonly string[] =>
  query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);

export const matchesTerms = (text: string, terms: readonly string[]): boolean =>
  terms.every((term) => text.includes(term));
