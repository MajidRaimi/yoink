import { YoinkError } from "./errors";

export type InteractiveCommandMessages = {
  notFound: string;
  failed: string;
};

export const wrapForPlatform = (argv: readonly string[], platform: NodeJS.Platform): string[] =>
  platform === "win32" ? ["cmd", "/c", ...argv] : [...argv];

const ignoreInterrupt = (): void => {};

export const waitIgnoringInterrupts = async (exited: Promise<number>): Promise<number> => {
  process.on("SIGINT", ignoreInterrupt);
  try {
    return await exited;
  } finally {
    process.off("SIGINT", ignoreInterrupt);
  }
};

export const runInteractiveCommand = async (
  argv: readonly string[],
  messages: InteractiveCommandMessages,
  platform: NodeJS.Platform = process.platform,
): Promise<void> => {
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn(wrapForPlatform(argv, platform), {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
  } catch {
    throw new YoinkError(messages.notFound);
  }
  const exitCode = await waitIgnoringInterrupts(proc.exited);
  if (exitCode !== 0) throw new YoinkError(messages.failed);
};
