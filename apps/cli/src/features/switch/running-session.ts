import { isProcessRunning, matchesProcess, parseTasklistProcesses } from "../../shared/processes/process-detection";
import type { ProcessLister, ProcessMatcher } from "../../shared/processes/types";

export const CLAUDE_PROCESS_MATCHER: ProcessMatcher = { names: ["claude"], exactName: true };

export const parsePgrepOutput = (output: string, ownPid: number): boolean => {
  const pids = output.trim().split("\n").filter(Boolean);
  return pids.some((pid) => pid !== String(ownPid));
};

export const parseTasklistOutput = (output: string): boolean =>
  parseTasklistProcesses(output).some((info) => matchesProcess(CLAUDE_PROCESS_MATCHER, info));

export const isClaudeRunning = (lister?: ProcessLister, ownPid?: number): Promise<boolean> =>
  isProcessRunning(CLAUDE_PROCESS_MATCHER, lister, ownPid);
