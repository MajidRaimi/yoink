import { homedir } from "node:os";
import { join } from "node:path";
import type { HarnessAdapter } from "../types";
import { defaultProbes, type DetectionProbes } from "./detection";
import { createOpencodeFamilyAdapter, type OpencodeFamilySpec } from "./opencode-family";

export type KiloPaths = {
  configDir: string;
};

const KILO_SPEC: OpencodeFamilySpec = {
  id: "kilo",
  label: "Kilo Code",
  binaries: ["kilo"],
  fileBase: "kilo",
  emptyConfigText: "{}\n",
};

export const defaultKiloPaths = (): KiloPaths => ({
  configDir: join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "kilo"),
});

export const createKiloAdapter = (paths: KiloPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter =>
  createOpencodeFamilyAdapter(KILO_SPEC, { configDir: paths.configDir, appBundles: [] }, probes);

export const kiloAdapter = createKiloAdapter(defaultKiloPaths());
