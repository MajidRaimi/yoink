import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type CliResult = { exitCode: number; stdout: string; stderr: string };

export const CLI_TEST_TIMEOUT_MS = 30_000;

const ENTRY = fileURLToPath(new URL("../../src/index.ts", import.meta.url));

const WINDOWS_PASSTHROUGH = ["SystemRoot", "SYSTEMROOT", "windir", "TEMP", "TMP", "PATHEXT", "ComSpec"] as const;

const passthrough = (): Record<string, string> =>
  Object.fromEntries(
    WINDOWS_PASSTHROUGH.flatMap((key) => {
      const value = process.env[key];
      return value === undefined ? [] : [[key, value]];
    }),
  );

export const scratchHomeEnv = (home: string): Record<string, string> => ({
  ...passthrough(),
  PATH: process.env.PATH ?? "",
  HOME: home,
  USERPROFILE: home,
  APPDATA: join(home, "AppData", "Roaming"),
  LOCALAPPDATA: join(home, "AppData", "Local"),
  NO_COLOR: "1",
});

export const runCli = async (home: string, args: readonly string[], stdin?: string): Promise<CliResult> => {
  const child = Bun.spawn([process.execPath, ENTRY, ...args], {
    env: scratchHomeEnv(home),
    stdin: stdin === undefined ? "ignore" : new TextEncoder().encode(stdin),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { exitCode, stdout, stderr };
};
