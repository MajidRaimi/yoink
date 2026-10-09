import { describe, expect, test } from "bun:test";
import { fileNameFromUrl, toDownloadHref } from "./release";

const dmgUrl = "https://example.com/desktop-v0.1.6/Yoink_0.1.6_x64.dmg";

const fallback = "https://example.com/releases";

describe("fileNameFromUrl", () => {
  test("returns the last path segment", () => {
    expect(fileNameFromUrl(dmgUrl)).toBe("Yoink_0.1.6_x64.dmg");
    expect(fileNameFromUrl("Yoink.dmg")).toBe("Yoink.dmg");
  });
});

describe("toDownloadHref", () => {
  test("keeps https links", () => {
    expect<string>(toDownloadHref(dmgUrl, fallback)).toBe(dmgUrl);
  });

  test("falls back for anything that is not https", () => {
    expect(toDownloadHref("javascript:alert(1)", fallback)).toBe(fallback);
    expect(toDownloadHref("http://example.com/Yoink.dmg", fallback)).toBe(fallback);
    expect(toDownloadHref("", fallback)).toBe(fallback);
  });
});
