import { mkdir } from "node:fs/promises";
import { PROFILES_PATH, YOINK_DIR } from "../../shared/paths";
import { writeFileAtomic } from "../../shared/atomic-write";
import type { Profile, ProfileStore } from "./types";

const emptyStore = (): ProfileStore => ({ current: null, profiles: {} });

export const loadStore = async (): Promise<ProfileStore> => {
  const file = Bun.file(PROFILES_PATH);
  if (!(await file.exists())) return emptyStore();
  const raw = (await file.json()) as {
    current?: string | null;
    profiles?: Record<string, Record<string, unknown>>;
  };
  const profiles: Record<string, Profile> = {};
  for (const [name, entry] of Object.entries(raw.profiles ?? {})) {
    profiles[name] = (entry.type ? entry : { ...entry, type: "claude" }) as Profile;
  }
  return { current: raw.current ?? null, profiles };
};

export const saveStore = async (store: ProfileStore): Promise<void> => {
  await mkdir(YOINK_DIR, { recursive: true, mode: 0o700 });
  await writeFileAtomic(PROFILES_PATH, JSON.stringify(store, null, 2), 0o600);
};
