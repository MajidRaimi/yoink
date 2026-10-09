import type { CommandIndexEntry } from "../command-query";

export const commandCardSelector = (id: string): string => `[data-command-id=${JSON.stringify(id)}]`;

export const commandEmptySelector = (group: string): string => `[data-command-empty=${JSON.stringify(group)}]`;

export const commandFilterCss = (
  index: readonly CommandIndexEntry[],
  matchedIds: ReadonlySet<string>,
  isFiltering: boolean,
): string => {
  if (!isFiltering) return "";
  const hiddenCards = index.filter((entry) => !matchedIds.has(entry.id)).map((entry) => commandCardSelector(entry.id));
  const groups = [...new Set(index.map((entry) => entry.group))];
  const emptyGroups = groups
    .filter((group) => !index.some((entry) => entry.group === group && matchedIds.has(entry.id)))
    .map(commandEmptySelector);
  return [
    hiddenCards.length === 0 ? "" : `${hiddenCards.join(",")}{display:none}`,
    emptyGroups.length === 0 ? "" : `${emptyGroups.join(",")}{display:block}`,
  ].join("");
};
