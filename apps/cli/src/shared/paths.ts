import { homedir } from "node:os";
import { join } from "node:path";

const home = homedir();

export const claudeConfigDir = (): string => process.env.CLAUDE_CONFIG_DIR ?? join(home, ".claude");

export const CLAUDE_CONFIG_PATH = process.env.CLAUDE_CONFIG_DIR
  ? join(claudeConfigDir(), ".claude.json")
  : join(home, ".claude.json");
export const YOINK_DIR = join(home, ".config", "yoink");
export const PROFILES_PATH = join(YOINK_DIR, "profiles.json");
