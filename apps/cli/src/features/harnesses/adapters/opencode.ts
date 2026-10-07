import { homedir } from "node:os";
import { join } from "node:path";
import type { HarnessAdapter } from "../types";
import { defaultProbes, type DetectionProbes } from "./detection";
import { createOpencodeFamilyAdapter, type OpencodeFamilyPaths, type OpencodeFamilySpec } from "./opencode-family";

export type OpencodePaths = OpencodeFamilyPaths;

const SCHEMA_URL = "https://opencode.ai/config.json";

const OPENCODE_SPEC: OpencodeFamilySpec = {
  id: "opencode",
  label: "opencode",
  binaries: ["opencode"],
  fileBase: "opencode",
  emptyConfigText: `${JSON.stringify({ $schema: SCHEMA_URL }, null, 2)}\n`,
};

const windowsInstallPaths = (localAppData: string | undefined): string[] =>
  localAppData ? [join(localAppData, "Programs", "OpenCode", "OpenCode.exe")] : [];

export const defaultOpencodePaths = (): OpencodePaths => ({
  configDir: join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "opencode"),
  appBundles: [
    "/Applications/OpenCode.app",
    "/opt/OpenCode",
    "/usr/share/applications/ai.opencode.desktop.desktop",
    ...windowsInstallPaths(process.env.LOCALAPPDATA),
  ],
});

export const createOpencodeAdapter = (
  paths: OpencodePaths,
  probes: DetectionProbes = defaultProbes,
): HarnessAdapter => createOpencodeFamilyAdapter(OPENCODE_SPEC, paths, probes);

export const opencodeAdapter = createOpencodeAdapter(defaultOpencodePaths());
