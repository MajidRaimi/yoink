import { expect, test } from "bun:test";
import {
  KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE,
  SECURITY_INTERACTIVE_LINE_LIMIT,
  assertKeychainWriteSucceeded,
  buildKeychainAddCommand,
  interpretKeychainRead,
  planKeychainWrite,
} from "../src/shared/credentials/keychain-command";
import { YoinkError } from "../src/shared/errors";

const SECRET = "sk-ant-oat01-SECRETVALUE";

const decodeHexArgument = (command: string): string => {
  const match = /-X ([0-9a-f]+)\n$/.exec(command);
  if (!match?.[1]) throw new Error("missing hex argument");
  return Buffer.from(match[1], "hex").toString("utf8");
};

test("buildKeychainAddCommand hex-encodes the blob so it needs no quoting", () => {
  expect(buildKeychainAddCommand("Claude Code-credentials", "raimi", "secret")).toBe(
    'add-generic-password -U -a "raimi" -s "Claude Code-credentials" -X 736563726574\n',
  );
});

test("buildKeychainAddCommand never places the raw blob on the command line", () => {
  const blob = JSON.stringify({ claudeAiOauth: { accessToken: `${SECRET}"x\\y`, scopes: ["a"] }, note: "line\nbreak" });
  const command = buildKeychainAddCommand("svc", "acct", blob);
  expect(command).not.toContain(SECRET);
  expect(command).not.toContain('"x');
  expect(command.split("\n")).toEqual([expect.any(String), ""]);
  expect(decodeHexArgument(command)).toBe(blob);
});

test("buildKeychainAddCommand round-trips multi-byte characters", () => {
  const blob = JSON.stringify({ name: "مجيد", emoji: "\u{1F511}" });
  expect(decodeHexArgument(buildKeychainAddCommand("svc", "acct", blob))).toBe(blob);
});

test("buildKeychainAddCommand rejects line breaks in service or account", () => {
  expect(() => buildKeychainAddCommand("svc", "a\nb", "blob")).toThrow(YoinkError);
  expect(() => buildKeychainAddCommand("s\rvc", "acct", "blob")).toThrow(YoinkError);
});

test("planKeychainWrite uses interactive stdin for blobs that fit one security line", () => {
  const plan = planKeychainWrite("svc", "acct", JSON.stringify({ token: SECRET }));
  expect(plan.kind).toBe("interactive");
  expect(plan.argv).toEqual(["security", "-i"]);
  if (plan.kind !== "interactive") throw new Error("expected interactive plan");
  expect(Buffer.byteLength(plan.stdin, "utf8")).toBeLessThanOrEqual(SECURITY_INTERACTIVE_LINE_LIMIT);
});

test("planKeychainWrite falls back to argv when the line would overflow security's buffer", () => {
  const mcpOAuth = Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`server-${index}`, { accessToken: `${SECRET}-${index}` }]),
  );
  const blob = JSON.stringify({ claudeAiOauth: { accessToken: SECRET }, mcpOAuth });
  expect(Buffer.byteLength(buildKeychainAddCommand("svc", "acct", blob))).toBeGreaterThan(
    SECURITY_INTERACTIVE_LINE_LIMIT,
  );
  const plan = planKeychainWrite("svc", "acct", blob);
  expect(plan.kind).toBe("argv");
  expect(plan.argv.slice(0, 8)).toEqual(["security", "add-generic-password", "-U", "-a", "acct", "-s", "svc", "-X"]);
  expect(plan.argv.join(" ")).not.toContain(SECRET);
  expect(Buffer.from(plan.argv[8] ?? "", "hex").toString("utf8")).toBe(blob);
});

test("interpretKeychainRead treats only errSecItemNotFound as missing credentials", () => {
  expect(interpretKeychainRead(KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE, "")).toBeNull();
  expect(interpretKeychainRead(0, "  \n")).toBeNull();
  expect(interpretKeychainRead(0, '{"a":1}\n')).toBe('{"a":1}');
});

test("interpretKeychainRead throws for denied, dismissed, or locked reads without echoing output", () => {
  for (const exitCode of [1, 36, 51, 128]) {
    let caught: unknown;
    try {
      interpretKeychainRead(exitCode, SECRET);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(YoinkError);
    expect((caught as YoinkError).message).toContain(String(exitCode));
    expect((caught as YoinkError).message).not.toContain(SECRET);
  }
});

test("assertKeychainWriteSucceeded passes on a clean exit", () => {
  expect(() => assertKeychainWriteSucceeded(0, "")).not.toThrow();
});

test("assertKeychainWriteSucceeded never echoes security stderr", () => {
  const leaked = `unknown command "${SECRET}"`;
  for (const [exitCode, stderr] of [[0, leaked], [1, leaked], [2, ""]] as const) {
    let caught: unknown;
    try {
      assertKeychainWriteSucceeded(exitCode, stderr);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(YoinkError);
    expect((caught as YoinkError).message).not.toContain(SECRET);
    expect((caught as YoinkError).message).toContain(`exited with ${exitCode}`);
  }
});
