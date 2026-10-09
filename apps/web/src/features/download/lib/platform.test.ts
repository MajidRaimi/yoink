import { describe, expect, test } from "bun:test";
import { PLATFORM_ATTRIBUTE, detectPlatform, platformScript } from "./platform";

const agents = {
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  darwin: "Yoink/0.6.5 (Macintosh; Darwin 23.4.0; arm64)",
} as const;

const IPAD_TOUCH_POINTS = 5;

describe("detectPlatform", () => {
  test("reads the user agent", () => {
    expect(detectPlatform({ userAgent: agents.mac })).toBe("mac");
    expect(detectPlatform({ userAgent: agents.windows })).toBe("windows");
    expect(detectPlatform({ userAgent: agents.linux })).toBe("linux");
  });

  test("does not mistake Darwin for Windows", () => {
    expect(detectPlatform({ userAgent: agents.darwin })).toBe("mac");
    expect(detectPlatform({ uaPlatform: "Win32", userAgent: "" })).toBe("windows");
  });

  test("treats iPads that report a Mac user agent as unknown", () => {
    expect(detectPlatform({ userAgent: agents.mac, maxTouchPoints: IPAD_TOUCH_POINTS })).toBe("unknown");
    expect(detectPlatform({ userAgent: agents.mac, maxTouchPoints: 0 })).toBe("mac");
    expect(detectPlatform({ userAgent: agents.windows, maxTouchPoints: IPAD_TOUCH_POINTS })).toBe("windows");
  });

  test("treats phones as unknown", () => {
    expect(detectPlatform({ userAgent: agents.android })).toBe("unknown");
    expect(detectPlatform({ userAgent: agents.iphone })).toBe("unknown");
  });

  test("prefers userAgentData platform", () => {
    expect(detectPlatform({ uaPlatform: "macOS", userAgent: agents.linux })).toBe("mac");
    expect(detectPlatform({ uaPlatform: "Windows", userAgent: agents.mac })).toBe("windows");
    expect(detectPlatform({ uaPlatform: "Chrome OS", userAgent: "" })).toBe("linux");
  });

  test("falls back to the user agent when the platform hint is unrecognized", () => {
    expect(detectPlatform({ uaPlatform: "Unknown", userAgent: agents.mac })).toBe("mac");
    expect(detectPlatform({ uaPlatform: "", userAgent: "" })).toBe("unknown");
  });
});

const runScript = (userAgent: string, uaPlatform?: string, maxTouchPoints = 0): string | null => {
  const attributes = new Map<string, string>();
  const documentStub = { documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) } };
  const navigatorStub = { userAgent, maxTouchPoints, userAgentData: uaPlatform === undefined ? undefined : { platform: uaPlatform } };
  new Function("navigator", "document", platformScript)(navigatorStub, documentStub);
  return attributes.get(PLATFORM_ATTRIBUTE) ?? null;
};

describe("platformScript", () => {
  test("marks only Macs, matching detectPlatform", () => {
    for (const userAgent of Object.values(agents)) {
      expect(runScript(userAgent) === "mac").toBe(detectPlatform({ userAgent }) === "mac");
    }
    expect(runScript(agents.linux, "macOS")).toBe("mac");
    expect(runScript(agents.mac, "Windows")).toBeNull();
    expect(runScript(agents.darwin)).toBe("mac");
    expect(runScript(agents.mac, undefined, IPAD_TOUCH_POINTS)).toBeNull();
  });
});
