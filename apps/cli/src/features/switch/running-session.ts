export const parsePgrepOutput = (output: string, ownPid: number): boolean => {
  const pids = output.trim().split("\n").filter(Boolean);
  return pids.some((pid) => pid !== String(ownPid));
};

export const parseTasklistOutput = (output: string): boolean => {
  const lines = output.trim().split("\n").filter(Boolean);
  return lines.some((line) => line.toLowerCase().startsWith('"claude.exe"'));
};

const runDetection = async (command: string[], parse: (output: string) => boolean): Promise<boolean> => {
  const proc = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
  const [output, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) return false;
  return parse(output);
};

export const isClaudeRunning = async (): Promise<boolean> => {
  try {
    if (process.platform === "win32") {
      return await runDetection(
        ["tasklist", "/FI", "IMAGENAME eq claude.exe", "/FO", "CSV", "/NH"],
        parseTasklistOutput,
      );
    }
    return await runDetection(
      ["pgrep", "-x", "claude"],
      (output) => parsePgrepOutput(output, process.pid),
    );
  } catch {
    return false;
  }
};
