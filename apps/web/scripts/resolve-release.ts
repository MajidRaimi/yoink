import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type DesktopDownloads = {
  arm64: string;
  x64: string;
};

export type DesktopRelease = {
  version: string;
  dmg: DesktopDownloads;
};

export type ResolvedRelease = {
  cli: string;
  desktop: DesktopRelease;
};

type ReleaseAsset = {
  name: string;
  url: string;
};

type GithubRelease = {
  tag: string;
  draft: boolean;
  prerelease: boolean;
  assets: readonly ReleaseAsset[];
};

const REPO = "MajidRaimi/yoink";
const DESKTOP_TAG_PREFIX = "desktop-v";
const REQUEST_TIMEOUT_MS = 10_000;
const WEB_ROOT = join(import.meta.dir, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const OUTPUT_PATH = join(WEB_ROOT, "src", "shared", "brand", "release.gen.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseAsset = (value: unknown): ReleaseAsset | null => {
  if (!isRecord(value)) return null;
  const { name, browser_download_url: url } = value;
  return typeof name === "string" && typeof url === "string" ? { name, url } : null;
};

const parseRelease = (value: unknown): GithubRelease | null => {
  if (!isRecord(value) || typeof value.tag_name !== "string") return null;
  const assets = Array.isArray(value.assets) ? value.assets : [];
  return {
    tag: value.tag_name,
    draft: value.draft === true,
    prerelease: value.prerelease === true,
    assets: assets.map(parseAsset).filter((asset): asset is ReleaseAsset => asset !== null),
  };
};

export const parseReleases = (payload: unknown): GithubRelease[] =>
  Array.isArray(payload)
    ? payload.map(parseRelease).filter((release): release is GithubRelease => release !== null)
    : [];

const versionParts = (version: string): number[] => version.split(".").map((part) => Number.parseInt(part, 10) || 0);

export const compareVersions = (left: string, right: string): number => {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
};

export const dmgFileName = (version: string, arch: "aarch64" | "x64"): string => `Yoink_${version}_${arch}.dmg`;

export const fallbackDesktop = (version: string): DesktopRelease => {
  const base = `https://github.com/${REPO}/releases/download/${DESKTOP_TAG_PREFIX}${version}`;
  return {
    version,
    dmg: {
      arm64: `${base}/${dmgFileName(version, "aarch64")}`,
      x64: `${base}/${dmgFileName(version, "x64")}`,
    },
  };
};

const toDesktopRelease = (release: GithubRelease): DesktopRelease | null => {
  if (release.draft || release.prerelease || !release.tag.startsWith(DESKTOP_TAG_PREFIX)) return null;
  const version = release.tag.slice(DESKTOP_TAG_PREFIX.length);
  const urlFor = (arch: "aarch64" | "x64"): string | undefined =>
    release.assets.find((asset) => asset.name === dmgFileName(version, arch))?.url;
  const arm64 = urlFor("aarch64");
  const x64 = urlFor("x64");
  return arm64 && x64 ? { version, dmg: { arm64, x64 } } : null;
};

export const pickDesktopRelease = (releases: readonly GithubRelease[]): DesktopRelease | null =>
  releases
    .map(toDesktopRelease)
    .filter((release): release is DesktopRelease => release !== null)
    .reduce<DesktopRelease | null>(
      (newest, candidate) => (newest && compareVersions(newest.version, candidate.version) >= 0 ? newest : candidate),
      null,
    );

export const serializeRelease = (release: ResolvedRelease): string =>
  `${JSON.stringify(
    {
      cli: release.cli,
      desktop: {
        version: release.desktop.version,
        dmg: { arm64: release.desktop.dmg.arm64, x64: release.desktop.dmg.x64 },
      },
    },
    null,
    2,
  )}\n`;

const readVersion = (path: string): string => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isRecord(parsed) || typeof parsed.version !== "string") throw new Error(`No version field in ${path}`);
  return parsed.version;
};

const fetchReleases = async (): Promise<GithubRelease[]> => {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "yoink-web-build",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GitHub releases request failed with ${response.status}`);
  return parseReleases(await response.json());
};

const resolveDesktop = async (): Promise<DesktopRelease> => {
  const fallbackVersion = readVersion(join(REPO_ROOT, "apps", "desktop", "src-tauri", "tauri.conf.json"));
  try {
    const live = pickDesktopRelease(await fetchReleases());
    if (live) return live;
    console.warn(`No desktop release with both DMGs found, using tauri.conf.json ${fallbackVersion}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Falling back to tauri.conf.json ${fallbackVersion}: ${reason}`);
  }
  return fallbackDesktop(fallbackVersion);
};

const main = async (): Promise<void> => {
  const release: ResolvedRelease = {
    cli: readVersion(join(REPO_ROOT, "apps", "cli", "package.json")),
    desktop: await resolveDesktop(),
  };
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, serializeRelease(release));
  console.log(`wrote src/shared/brand/release.gen.json (cli ${release.cli}, desktop ${release.desktop.version})`);
};

if (import.meta.main) await main();
