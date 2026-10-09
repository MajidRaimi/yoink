export type ProofStats = {
  monthlyDownloads?: number;
  stars?: number;
  latestRelease?: string;
};

export type ProofClause = {
  key: keyof ProofStats;
  term?: string;
  before: string;
  value: string;
  after: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonNegativeInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;

export const parseNpmDownloads = (body: unknown): number | undefined =>
  isRecord(body) ? nonNegativeInteger(body.downloads) : undefined;

export const parseGithubStars = (body: unknown): number | undefined =>
  isRecord(body) ? nonNegativeInteger(body.stargazers_count) : undefined;

const CLI_TAG = /^v\d+\.\d+\.\d+$/;

export const parseLatestCliTag = (body: unknown): string | undefined => {
  if (!Array.isArray(body)) return undefined;
  for (const release of body) {
    if (!isRecord(release) || release.draft === true || release.prerelease === true) continue;
    if (typeof release.tag_name === "string" && CLI_TAG.test(release.tag_name)) return release.tag_name;
  }
  return undefined;
};

const integerFormat = new Intl.NumberFormat("en-US");

export const formatCount = (value: number): string => integerFormat.format(value);

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

export const proofClauses = (stats: ProofStats): ProofClause[] => {
  const clauses: ProofClause[] = [];
  if (stats.monthlyDownloads !== undefined) {
    clauses.push({
      key: "monthlyDownloads",
      term: "yoink-cli",
      before: " was downloaded ",
      value: formatCount(stats.monthlyDownloads),
      after: ` ${plural(stats.monthlyDownloads, "time", "times")} from npm last month`,
    });
  }
  if (stats.stars !== undefined) {
    clauses.push({
      key: "stars",
      before: "the repo has ",
      value: formatCount(stats.stars),
      after: ` ${plural(stats.stars, "star", "stars")} on GitHub`,
    });
  }
  if (stats.latestRelease !== undefined) {
    clauses.push({ key: "latestRelease", before: "the latest CLI release is ", value: stats.latestRelease, after: "" });
  }
  return clauses;
};

export const clauseSeparator = (index: number, count: number): string => {
  if (index === count - 1) return ".";
  if (index === count - 2) return count === 2 ? " and " : ", and ";
  return ", ";
};
