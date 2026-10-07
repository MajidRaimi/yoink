import { fileURLToPath } from "node:url";

export type CliResult = { exitCode: number; stdout: string; stderr: string };

export const CLI_TEST_TIMEOUT_MS = 30_000;

const ENTRY = fileURLToPath(new URL("../../src/index.ts", import.meta.url));

export const runCli = async (home: string, args: readonly string[], stdin?: string): Promise<CliResult> => {
  const child = Bun.spawn([process.execPath, ENTRY, ...args], {
    env: { PATH: process.env.PATH ?? "", HOME: home, NO_COLOR: "1" },
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
