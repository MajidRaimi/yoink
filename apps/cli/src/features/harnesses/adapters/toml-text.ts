export type TomlStringEntry = readonly [key: string, value: string];

const BARE_KEY = /^[A-Za-z0-9_-]+$/;
const HEADER_SEGMENT_SOURCE = String.raw`\s*("(?:[^"\\]|\\.)*"|'[^']*'|[A-Za-z0-9_-]+)\s*(\.|\])`;
const HEADER_TAIL = /^\]?\s*(#.*)?$/;
const COMMENT_OR_BLANK = /^\s*(#.*)?$/;
const TRAILING_WHITESPACE = /\s*$/;

export const tomlKey = (key: string): string => (BARE_KEY.test(key) ? key : JSON.stringify(key));

export const tomlString = (value: string): string => JSON.stringify(value).replaceAll("\u007f", "\\u007F");

const unquoteKey = (raw: string): string | undefined => {
  if (raw.startsWith("'")) return raw.slice(1, -1);
  if (!raw.startsWith('"')) return raw;
  try {
    return JSON.parse(raw) as string;
  } catch {
    return undefined;
  }
};

export const readHeaderPath = (line: string): string[] | undefined => {
  const trimmed = line.trim();
  if (!trimmed.startsWith("[")) return undefined;
  const segmentPattern = new RegExp(HEADER_SEGMENT_SOURCE, "y");
  segmentPattern.lastIndex = trimmed.startsWith("[[") ? 2 : 1;
  const segments: string[] = [];
  for (let match = segmentPattern.exec(trimmed); match; match = segmentPattern.exec(trimmed)) {
    const segment = unquoteKey(match[1] ?? "");
    if (segment === undefined) return undefined;
    segments.push(segment);
    if (match[2] === "]") return HEADER_TAIL.test(trimmed.slice(segmentPattern.lastIndex)) ? segments : undefined;
  }
  return undefined;
};

const startsWithPath = (path: readonly string[], prefix: readonly string[]): boolean =>
  path.length >= prefix.length && prefix.every((segment, index) => path[index] === segment);

const samePath = (path: readonly string[], other: readonly string[]): boolean =>
  path.length === other.length && startsWithPath(path, other);

type Section = { start: number; end: number; path: string[] };

const splitLines = (text: string): string[] => text.split("\n");

const joinLines = (lines: readonly string[]): string => {
  const body = lines.join("\n").replace(TRAILING_WHITESPACE, "");
  return body.length > 0 ? `${body}\n` : "";
};

const findSections = (lines: readonly string[]): Section[] => {
  const headers = lines.flatMap((line, index) => {
    const path = readHeaderPath(line);
    return path ? [{ index, path }] : [];
  });
  return headers.map((header, position) => ({
    start: header.index,
    end: headers[position + 1]?.index ?? lines.length,
    path: header.path,
  }));
};

const firstHeaderIndex = (lines: readonly string[]): number => findSections(lines)[0]?.start ?? lines.length;

const withoutSections = (lines: readonly string[], sections: readonly Section[]): string[] =>
  lines.filter((_, index) => !sections.some((section) => index >= section.start && index < section.end));

const assignmentLine = (key: string, value: string): string => `${tomlKey(key)} = ${tomlString(value)}`;

const sectionLines = (path: readonly string[], entries: readonly TomlStringEntry[]): string[] => [
  `[${path.map(tomlKey).join(".")}]`,
  ...entries.map(([key, value]) => assignmentLine(key, value)),
];

const trailingTrivia = (lines: readonly string[], section: Section): string[] => {
  const body = lines.slice(section.start + 1, section.end);
  const firstTrivia = body.findLastIndex((line) => !COMMENT_OR_BLANK.test(line)) + 1;
  return body.slice(firstTrivia);
};

const isBlank = (line: string | undefined): boolean => line === undefined || line.trim().length === 0;

const mergeAdjacentSections = (sections: readonly Section[]): Section[] =>
  sections.reduce<Section[]>((runs, section) => {
    const previous = runs.at(-1);
    if (previous && previous.end === section.start) return runs.with(-1, { ...previous, end: section.end });
    return [...runs, section];
  }, []);

const keptTriviaLength = (lines: readonly string[], run: Section, last: Section): number => {
  if (run.end >= lines.length) return 0;
  const trivia = trailingTrivia(lines, last);
  const precededByBlank = run.start === 0 || isBlank(lines[run.start - 1]);
  const leadingBlanks = precededByBlank ? trivia.findIndex((line) => !isBlank(line)) : 0;
  return trivia.length - (leadingBlanks < 0 ? trivia.length : leadingBlanks);
};

const removalRange = (lines: readonly string[], doomed: readonly Section[], run: Section): Section => {
  const last = doomed.findLast((section) => section.end === run.end) ?? run;
  return { ...run, end: run.end - keptTriviaLength(lines, run, last) };
};

export const removeTableSections = (text: string, prefix: readonly string[]): string => {
  const lines = splitLines(text);
  const doomed = findSections(lines).filter((section) => startsWithPath(section.path, prefix));
  if (doomed.length === 0) return text;
  const ranges = mergeAdjacentSections(doomed).map((run) => removalRange(lines, doomed, run));
  return joinLines(withoutSections(lines, ranges));
};

export const upsertTableSection = (
  text: string,
  path: readonly string[],
  entries: readonly TomlStringEntry[],
): string => {
  const lines = splitLines(text);
  const sections = findSections(lines);
  const target = sections.find((section) => samePath(section.path, path));
  const descendants = sections.filter((section) => section !== target && startsWithPath(section.path, path));
  if (!target) {
    const remaining = joinLines(withoutSections(lines, descendants));
    const separator = remaining.length > 0 ? [remaining.trimEnd(), ""] : [];
    return joinLines([...separator, ...sectionLines(path, entries)]);
  }
  const replacement = [...sectionLines(path, entries), ...trailingTrivia(lines, target)];
  const rebuilt = lines.flatMap((line, index) => {
    if (index === target.start) return replacement;
    if (index > target.start && index < target.end) return [];
    return descendants.some((section) => index >= section.start && index < section.end) ? [] : [line];
  });
  return joinLines(rebuilt);
};

const rootKeyIndex = (lines: readonly string[], key: string): number => {
  const pattern = new RegExp(`^\\s*(${RegExp.escape(key)}|"${RegExp.escape(key)}")\\s*=`);
  const limit = firstHeaderIndex(lines);
  return lines.findIndex((line, index) => index < limit && pattern.test(line));
};

const rootInsertionIndex = (lines: readonly string[]): number => {
  const limit = firstHeaderIndex(lines);
  const lastContent = lines.slice(0, limit).findLastIndex((line) => !COMMENT_OR_BLANK.test(line));
  return lastContent + 1;
};

export const setRootString = (text: string, key: string, value: string): string => {
  const lines = splitLines(text);
  const existing = rootKeyIndex(lines, key);
  if (existing >= 0) return joinLines(lines.with(existing, assignmentLine(key, value)));
  const insertAt = rootInsertionIndex(lines);
  const nextIsHeader = readHeaderPath(lines[insertAt] ?? "") !== undefined;
  const inserted = nextIsHeader ? [assignmentLine(key, value), ""] : [assignmentLine(key, value)];
  return joinLines(lines.toSpliced(insertAt, 0, ...inserted));
};

export const removeRootKey = (text: string, key: string): string => {
  const lines = splitLines(text);
  const existing = rootKeyIndex(lines, key);
  if (existing < 0) return text;
  const remaining = lines.toSpliced(existing, 1);
  const limit = firstHeaderIndex(remaining);
  const rootIsBlank = remaining.slice(0, limit).every((line) => line.trim().length === 0);
  return joinLines(rootIsBlank ? remaining.slice(limit) : remaining);
};
