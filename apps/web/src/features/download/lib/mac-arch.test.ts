import { describe, expect, test } from "bun:test";
import { archFromHints } from "./mac-arch";

describe("archFromHints", () => {
  test("uses client hint architecture first", () => {
    expect(archFromHints({ architecture: "arm", renderer: "Intel Iris" })).toBe("arm64");
    expect(archFromHints({ architecture: "x86" })).toBe("x64");
  });

  test("falls back to the WebGL renderer", () => {
    expect(archFromHints({ renderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)" })).toBe("arm64");
    expect(archFromHints({ renderer: "ANGLE (Intel Inc., Intel(R) Iris(TM) Plus Graphics, OpenGL 4.1)" })).toBe("x64");
    expect(archFromHints({ renderer: "Apple GPU" })).toBeNull();
    expect(archFromHints({})).toBeNull();
  });
});
