export type RovingDirection = "next" | "previous" | "first" | "last";

export type RovingKeyMap = Readonly<Record<string, RovingDirection>>;

export const HORIZONTAL_ROVING_KEYS: RovingKeyMap = {
  ArrowRight: "next",
  ArrowLeft: "previous",
  Home: "first",
  End: "last",
};

export const BIDIRECTIONAL_ROVING_KEYS: RovingKeyMap = {
  ...HORIZONTAL_ROVING_KEYS,
  ArrowDown: "next",
  ArrowUp: "previous",
};

export const directionForKey = (key: string, keys: RovingKeyMap): RovingDirection | undefined =>
  Object.hasOwn(keys, key) ? keys[key] : undefined;

export const moveIndex = (current: number, count: number, direction: RovingDirection): number => {
  if (count === 0) return -1;
  if (direction === "first") return 0;
  if (direction === "last") return count - 1;
  const step = direction === "next" ? 1 : -1;
  return (current + step + count) % count;
};

export const rovingTarget = <Item>(
  items: readonly Item[],
  current: Item,
  key: string,
  keys: RovingKeyMap,
): Item | undefined => {
  const direction = directionForKey(key, keys);
  if (direction === undefined) return undefined;
  return items[moveIndex(items.indexOf(current), items.length, direction)];
};
