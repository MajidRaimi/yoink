import { execFileSync } from "node:child_process";

export type PageDates = {
  published: string;
  modified: string;
};

export type GitRunner = (args: readonly string[]) => string | null;

export type DateResolver = (sources: readonly string[]) => PageDates;

const runGit: GitRunner = (args) => {
  try {
    return execFileSync("git", [...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
};

const topLevelPathspec = (source: string): string => `:(top)${source}`;

const toIsoDate = (value: string | undefined): string | null => {
  if (value === undefined) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const commitDates = (output: string | null): readonly string[] =>
  (output ?? "")
    .split("\n")
    .map((line) => toIsoDate(line))
    .filter((date): date is string => date !== null);

export const createDateResolver = (git: GitRunner, buildTime: Date): DateResolver => {
  const fallback = buildTime.toISOString();
  const cache = new Map<string, PageDates>();
  return (sources) => {
    const key = sources.join("\n");
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const dates =
      sources.length === 0 ? [] : commitDates(git(["log", "--format=%cI", "--", ...sources.map(topLevelPathspec)])).toSorted();
    const resolved: PageDates = {
      published: dates.at(0) ?? fallback,
      modified: dates.at(-1) ?? fallback,
    };
    cache.set(key, resolved);
    return resolved;
  };
};

export const lastModified: DateResolver = createDateResolver(runGit, new Date());

const displayDateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export const formatDisplayDate = (iso: string): string => displayDateFormat.format(new Date(iso));
