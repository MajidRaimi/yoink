export type RovingDirection = "next" | "previous" | "first" | "last";

const KEY_DIRECTIONS: Readonly<Record<string, RovingDirection>> = {
  ArrowRight: "next",
  ArrowDown: "next",
  ArrowLeft: "previous",
  ArrowUp: "previous",
  Home: "first",
  End: "last",
};

export const directionForKey = (key: string): RovingDirection | undefined =>
  Object.hasOwn(KEY_DIRECTIONS, key) ? KEY_DIRECTIONS[key] : undefined;

export const moveIndex = (current: number, count: number, direction: RovingDirection): number => {
  if (count === 0) return -1;
  if (direction === "first") return 0;
  if (direction === "last") return count - 1;
  const step = direction === "next" ? 1 : -1;
  return (current + step + count) % count;
};
