import { site } from "@/shared/brand/site";
import { parseGithubStars, parseLatestCliTag, parseNpmDownloads, type ProofStats } from "@/features/landing/proof/stats";

const NPM_URL = `https://api.npmjs.org/downloads/point/last-month/${site.npmPackage}`;
const GITHUB_REPO_URL = site.repo.replace("https://github.com/", "https://api.github.com/repos/");
const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases?per_page=30`;
const TIMEOUT_MS = 8000;

const githubHeaders = (): HeadersInit => {
  const token = process.env.GITHUB_TOKEN;
  const base = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  return token === undefined || token === "" ? base : { ...base, Authorization: `Bearer ${token}` };
};

const fetchJson = async (url: string, headers?: HeadersInit): Promise<unknown> => {
  try {
    const response = await fetch(url, { headers, cache: "force-cache", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return undefined;
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
};

export const fetchProofStats = async (): Promise<ProofStats> => {
  const [npm, repo, releases] = await Promise.all([
    fetchJson(NPM_URL),
    fetchJson(GITHUB_REPO_URL, githubHeaders()),
    fetchJson(GITHUB_RELEASES_URL, githubHeaders()),
  ]);
  return {
    monthlyDownloads: parseNpmDownloads(npm),
    stars: parseGithubStars(repo),
    latestRelease: parseLatestCliTag(releases),
  };
};
