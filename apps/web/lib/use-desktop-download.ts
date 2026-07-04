"use client";

import { useCallback, useEffect, useState } from "react";
import { desktopDmgUrl, site } from "@/lib/site";

export type DesktopArch = "aarch64" | "x64";

type ResolvedRelease = {
  version: string;
  aarch64: string;
  x64: string;
  ts: number;
};

type GithubAsset = {
  name: string;
  browser_download_url: string;
};

type GithubRelease = {
  tag_name: string;
  assets: GithubAsset[];
};

const CACHE_KEY = "yoink-desktop-release";
const CACHE_TTL = 6 * 60 * 60 * 1000;
const RELEASES_API = "https://api.github.com/repos/MajidRaimi/yoink/releases";
const DESKTOP_TAG_PREFIX = "desktop-v";

const readCache = (): ResolvedRelease | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResolvedRelease;
    if (!parsed?.version || !parsed.aarch64 || !parsed.x64) return null;
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (release: ResolvedRelease) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(release));
  } catch {
    return;
  }
};

const compareSemver = (a: string, b: string) => {
  const left = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < 3; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const fetchLatestRelease = async (): Promise<ResolvedRelease | null> => {
  const response = await fetch(RELEASES_API, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) return null;

  const releases = (await response.json()) as GithubRelease[];
  const desktopReleases = releases
    .filter((release) => release.tag_name.startsWith(DESKTOP_TAG_PREFIX))
    .filter((release) => release.tag_name !== "desktop-latest")
    .map((release) => ({ release, version: release.tag_name.slice(DESKTOP_TAG_PREFIX.length) }))
    .filter((entry) => /^\d+\.\d+\.\d+/.test(entry.version))
    .sort((a, b) => compareSemver(b.version, a.version));

  const best = desktopReleases[0];
  if (!best) return null;

  const findAsset = (suffix: string) =>
    best.release.assets.find((asset) => asset.browser_download_url.endsWith(suffix))
      ?.browser_download_url;

  const aarch64 = findAsset("_aarch64.dmg");
  const x64 = findAsset("_x64.dmg");
  if (!aarch64 || !x64) return null;

  return { version: best.version, aarch64, x64, ts: Date.now() };
};

const detectIntel = async (): Promise<boolean> => {
  try {
    const uaData = (
      navigator as Navigator & {
        userAgentData?: {
          getHighEntropyValues: (hints: string[]) => Promise<{ architecture?: string }>;
        };
      }
    ).userAgentData;
    if (uaData?.getHighEntropyValues) {
      const { architecture } = await uaData.getHighEntropyValues(["architecture"]);
      if (architecture === "x86") return true;
    }
  } catch {
    void 0;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    const debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && debugInfo) {
      const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      if (/intel|amd|radeon/i.test(renderer)) return true;
    }
  } catch {
    void 0;
  }

  return false;
};

export const useDesktopDownload = () => {
  const [arch, setArch] = useState<DesktopArch>("aarch64");
  const [release, setRelease] = useState<ResolvedRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void detectIntel().then((isIntel) => {
      if (active && isIntel) setArch("x64");
    });

    const cached = readCache();
    if (cached) {
      setRelease(cached);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void fetchLatestRelease()
      .then((resolved) => {
        if (!active || !resolved) return;
        setRelease(resolved);
        writeCache(resolved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const version = release?.version ?? site.desktopVersion;
  const aarch64Url = release?.aarch64 ?? desktopDmgUrl("aarch64");
  const x64Url = release?.x64 ?? desktopDmgUrl("x64");

  const urlForArch = useCallback(
    (target: DesktopArch) => (target === "aarch64" ? aarch64Url : x64Url),
    [aarch64Url, x64Url],
  );

  return {
    arch,
    setArch,
    version,
    urlForArch,
    aarch64Url,
    x64Url,
    releasesUrl: site.releasesUrl,
    loading,
  };
};
