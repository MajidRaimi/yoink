export type HeadingPosition = {
  intersecting: boolean;
  passed: boolean;
};

export type HeadingPositions = ReadonlyMap<string, HeadingPosition>;

export type HeadingEntry = {
  id: string;
  intersecting: boolean;
  top: number;
  bandBottom: number;
};

export const applyHeadingEntries = (
  positions: HeadingPositions,
  entries: readonly HeadingEntry[],
): HeadingPositions => {
  const next = new Map(positions);
  for (const entry of entries) {
    next.set(entry.id, { intersecting: entry.intersecting, passed: entry.top <= entry.bandBottom });
  }
  return next;
};

export const resolveActiveHeading = (ids: readonly string[], positions: HeadingPositions): string | null => {
  const firstIntersecting = ids.find((id) => positions.get(id)?.intersecting === true);
  if (firstIntersecting !== undefined) return firstIntersecting;
  const lastPassed = ids.findLast((id) => positions.get(id)?.passed === true);
  return lastPassed ?? ids[0] ?? null;
};
