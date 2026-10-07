import pc from "picocolors";
import { experimentalTag } from "../features/harnesses/experimental-tag";
import { theme } from "../shared/theme";

export const JSON_SWITCH = "--json";

export const printJson = (value: unknown): void => {
  console.log(JSON.stringify(value, null, 2));
};

export interface HarnessLine {
  active: boolean;
  label: string;
  experimental: boolean;
  state: string;
  configPath: string;
}

export const formatHarnessLine = (line: HarnessLine): string => {
  const marker = line.active ? theme.active("●") : pc.dim("○");
  const state = `${line.state}${experimentalTag(line.experimental)}`;
  return `${marker} ${pc.bold(line.label.padEnd(14))} ${state}  ${pc.dim(line.configPath)}`;
};
