import { expect, test } from "bun:test";
import {
  KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE,
  KeychainSecretTooLargeError,
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
  expect(plan.argv).toEqual(["security", "-i"]);
  expect(plan.argv.join(" ")).not.toContain(Buffer.from(SECRET).toString("hex"));
  expect(Buffer.byteLength(plan.stdin, "utf8")).toBeLessThanOrEqual(SECURITY_INTERACTIVE_LINE_LIMIT);
});

const base64url = (value: string): string => Buffer.from(value, "utf8").toString("base64url");

const fakeJwt = (claims: Record<string, unknown>): string =>
  `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify(claims))}.${base64url("fake-signature".repeat(20))}`;

const fakeCodexAuthJson = (targetBytes: number): string => {
  const padding = "x".repeat(targetBytes);
  const auth = {
    OPENAI_API_KEY: null,
    tokens: {
      id_token: fakeJwt({ email: "fake@example.test", padding }),
      access_token: fakeJwt({ scope: "openid", padding }),
      refresh_token: "rt_fake_refresh_token_value",
      account_id: "fake-account",
    },
    last_refresh: "2026-01-01T00:00:00Z",
  };
  return JSON.stringify(auth);
};

const capturePlanError = (blob: string): unknown => {
  try {
    return planKeychainWrite("Codex Auth", "cli|0123456789abcdef", blob);
  } catch (error) {
    return error;
  }
};

test("planKeychainWrite refuses a 5 KB Codex auth.json instead of placing it on the command line", () => {
  const blob = fakeCodexAuthJson(2500);
  expect(Buffer.byteLength(blob, "utf8")).toBeGreaterThan(5000);
  const outcome = capturePlanError(blob);
  expect(outcome).toBeInstanceOf(KeychainSecretTooLargeError);
  const message = (outcome as KeychainSecretTooLargeError).message;
  expect(message).toContain("Codex Auth");
  expect(message).toContain('cli_auth_credentials_store = "file"');
  expect(message).not.toContain("rt_fake_refresh_token_value");
  expect(message).not.toContain(Buffer.from("rt_fake_refresh_token_value").toString("hex"));
});

test("planKeychainWrite never yields a plan whose argv carries the secret, at any size", () => {
  const marker = "rt_fake_refresh_token_value";
  for (const size of [10, 500, 1500, 1900, 2000, 4000, 8000]) {
    const outcome = capturePlanError(fakeCodexAuthJson(size));
    if (outcome instanceof KeychainSecretTooLargeError) continue;
    const plan = outcome as ReturnType<typeof planKeychainWrite>;
    expect(plan.argv).toEqual(["security", "-i"]);
    const joined = plan.argv.join(" ");
    expect(joined).not.toContain(marker);
    expect(joined).not.toContain(Buffer.from(marker).toString("hex"));
    expect(Buffer.byteLength(plan.stdin, "utf8")).toBeLessThanOrEqual(SECURITY_INTERACTIVE_LINE_LIMIT);
  }
});

test("planKeychainWrite refuses oversized Claude blobs rather than falling back to argv", () => {
  const mcpOAuth = Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`server-${index}`, { accessToken: `${SECRET}-${index}` }]),
  );
  const blob = JSON.stringify({ claudeAiOauth: { accessToken: SECRET }, mcpOAuth });
  expect(Buffer.byteLength(buildKeychainAddCommand("svc", "acct", blob))).toBeGreaterThan(
    SECURITY_INTERACTIVE_LINE_LIMIT,
  );
  expect(() => planKeychainWrite("svc", "acct", blob)).toThrow(KeychainSecretTooLargeError);
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
