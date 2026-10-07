import { expect, test } from "bun:test";
import { runInteractiveCommand, wrapForPlatform } from "../src/shared/interactive-command";
import { YoinkError } from "../src/shared/errors";

const messages = { notFound: "tool not found", failed: "tool failed" };

test("wrapForPlatform prefixes cmd /c on Windows only", () => {
  expect(wrapForPlatform(["codex", "login"], "win32")).toEqual(["cmd", "/c", "codex", "login"]);
  expect(wrapForPlatform(["codex", "login"], "linux")).toEqual(["codex", "login"]);
  expect(wrapForPlatform(["codex", "login"], "darwin")).toEqual(["codex", "login"]);
});

test("runInteractiveCommand resolves when the command exits zero", async () => {
  await expect(runInteractiveCommand([process.execPath, "-e", "0"], messages, "linux")).resolves.toBeUndefined();
});

test("runInteractiveCommand maps a non-zero exit to the failed message", async () => {
  const run = runInteractiveCommand([process.execPath, "-e", "process.exit(3)"], messages, "linux");
  await expect(run).rejects.toThrow(new YoinkError("tool failed"));
});

test("runInteractiveCommand maps a missing binary to the not found message", async () => {
  const run = runInteractiveCommand(["yoink-definitely-missing-binary-xyz"], messages, "linux");
  await expect(run).rejects.toThrow(new YoinkError("tool not found"));
});

test.skipIf(process.platform === "win32")("an interrupt while the command runs does not kill yoink", async () => {
  const interruptParent = `process.kill(process.ppid, "SIGINT"); setTimeout(() => process.exit(0), 200);`;
  await expect(runInteractiveCommand([process.execPath, "-e", interruptParent], messages, "linux")).resolves.toBeUndefined();
  expect(process.listenerCount("SIGINT")).toBe(0);
});
