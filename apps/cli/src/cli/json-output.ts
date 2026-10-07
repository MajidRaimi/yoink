import pc from "picocolors";
import { theme } from "../shared/theme";

export const JSON_SWITCH = "--json";

export const printJson = (value: unknown): void => {
  console.log(JSON.stringify(value, null, 2));
};

export interface HarnessLine {
  active: boolean;
  label: string;
  state: string;
  configPath: string;
}

export const formatHarnessLine = (line: HarnessLine): string => {
  const marker = line.active ? theme.active("●") : pc.dim("○");
  return `${marker} ${pc.bold(line.label.padEnd(12))} ${line.state}  ${pc.dim(line.configPath)}`;
};
