const KEY_OFFSETS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

export const targetIndex = (key: string, index: number, count: number): number | null => {
  if (count <= 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const offset = KEY_OFFSETS[key];
  return offset === undefined ? null : (index + offset + count) % count;
};
