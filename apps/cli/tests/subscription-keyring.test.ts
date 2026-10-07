import { expect, test } from "bun:test";
import {
  createKeyring,
  createMacKeyring,
  KeyringUnsupportedError,
  type CommandResult,
} from "../src/features/subscriptions/shared/keyring";
import { KeychainSecretTooLargeError } from "../src/shared/credentials/keychain-command";

type Call = { argv: string[]; stdin?: string };

const recorder = (results: CommandResult[]) => {
  const calls: Call[] = [];
  const run = async (argv: string[], stdin?: string): Promise<CommandResult> => {
    calls.push(stdin === undefined ? { argv } : { argv, stdin });
    return results.shift() ?? { exitCode: 0, stdout: "", stderr: "" };
  };
  return { calls, run };
};

const SECRET = "{\"tokens\":\"fake-secret\"}";

test("mac keyring reads a generic password and maps not-found to null", async () => {
  const { calls, run } = recorder([
    { exitCode: 0, stdout: `${SECRET}\n`, stderr: "" },
    { exitCode: 44, stdout: "", stderr: "not found" },
  ]);
  const keyring = createMacKeyring(run);
  expect(await keyring.read("Codex Auth", "cli|abc")).toBe(SECRET);
  expect(await keyring.read("Codex Auth", "cli|abc")).toBeNull();
  expect(calls[0]?.argv).toEqual(["security", "find-generic-password", "-w", "-s", "Codex Auth", "-a", "cli|abc"]);
});

test("mac keyring writes through security stdin so the secret is not in argv", async () => {
  const { calls, run } = recorder([]);
  await createMacKeyring(run).write("Codex Auth", "cli|abc", SECRET);
  expect(calls[0]?.argv).toEqual(["security", "-i"]);
  expect(calls[0]?.argv.join(" ")).not.toContain("fake-secret");
  expect(calls[0]?.stdin).toContain(Buffer.from(SECRET).toString("hex"));
});

test("mac keyring refuses an oversized secret without spawning security", async () => {
  const { calls, run } = recorder([]);
  const oversized = JSON.stringify({ tokens: { refresh_token: "fake-secret", padding: "x".repeat(5000) } });
  await expect(createMacKeyring(run).write("Codex Auth", "cli|abc", oversized)).rejects.toBeInstanceOf(
    KeychainSecretTooLargeError,
  );
  expect(calls).toHaveLength(0);
});

test("mac keyring remove tolerates a missing item and fails on other errors", async () => {
  const { run } = recorder([
    { exitCode: 44, stdout: "", stderr: "" },
    { exitCode: 1, stdout: "", stderr: "denied" },
  ]);
  const keyring = createMacKeyring(run);
  await keyring.remove("Codex Auth", "cli|abc");
  await expect(keyring.remove("Codex Auth", "cli|abc")).rejects.toThrow("Could not remove");
});

test("mac keyring read surfaces a locked keychain", async () => {
  const { run } = recorder([{ exitCode: 51, stdout: "", stderr: "" }]);
  await expect(createMacKeyring(run).read("s", "a")).rejects.toThrow("Unlock the Keychain");
});

test("keyring on other platforms refuses with KeyringUnsupportedError", async () => {
  const { calls, run } = recorder([]);
  const keyring = createKeyring("linux", run);
  await expect(keyring.read("s", "a")).rejects.toBeInstanceOf(KeyringUnsupportedError);
  await expect(keyring.write("s", "a", "x")).rejects.toBeInstanceOf(KeyringUnsupportedError);
  await expect(keyring.remove("s", "a")).rejects.toBeInstanceOf(KeyringUnsupportedError);
  expect(calls).toEqual([]);
});
