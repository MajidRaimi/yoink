import { expect, test } from "bun:test";
import { join } from "node:path";
import { selectBackend } from "../src/shared/credentials";
import { resolveCredentialsPath } from "../src/shared/credentials/file-backend";
import { YoinkError } from "../src/shared/errors";

test("selectBackend returns a backend for supported platforms", () => {
  for (const platform of ["darwin", "linux", "win32"] as const) {
    const backend = selectBackend(platform);
    expect(typeof backend.read).toBe("function");
    expect(typeof backend.write).toBe("function");
  }
});

test("selectBackend throws on unsupported platforms", () => {
  expect(() => selectBackend("freebsd" as NodeJS.Platform)).toThrow(YoinkError);
});

test("resolveCredentialsPath prefers CLAUDE_CONFIG_DIR when set", () => {
  const configDir = join("custom", "claude-config");
  const path = resolveCredentialsPath({ CLAUDE_CONFIG_DIR: configDir }, join("home", "user"));
  expect(path).toBe(join(configDir, ".credentials.json"));
});

test("resolveCredentialsPath falls back to ~/.claude when unset", () => {
  const home = join("home", "user");
  const path = resolveCredentialsPath({}, home);
  expect(path).toBe(join(home, ".claude", ".credentials.json"));
});
