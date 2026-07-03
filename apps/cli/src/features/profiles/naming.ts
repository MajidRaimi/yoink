import type { Profile } from "./types";

export const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "provider";

export const uniqueName = (profiles: Profile[], base: string): string => {
  const taken = new Set(profiles.map((profile) => profile.name));
  if (!taken.has(base)) return base;
  for (let suffix = 2; ; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
};
