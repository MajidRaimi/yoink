export const isClaudeRunning = async (): Promise<boolean> => {
  const proc = Bun.spawn(["pgrep", "-x", "claude"], { stdout: "pipe", stderr: "pipe" });
  const [output, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) return false;
  const pids = output.trim().split("\n").filter(Boolean);
  return pids.some((pid) => pid !== String(process.pid));
};
