import { describe, expect, test } from "bun:test";
import { site } from "@/shared/brand/site";
import { PLATFORMS } from "@/shared/contract";
import { INSTALL_OPTIONS, INSTALL_TAB_IDS, installCommandForPlatform, installTabForPlatform } from "./install-options";

describe("install options", () => {
  test("preselects the visitor tab", () => {
    expect(installTabForPlatform("mac")).toBe("macos");
    expect(installTabForPlatform("windows")).toBe("windows");
    expect(installTabForPlatform("linux")).toBe("linux");
    for (const platform of PLATFORMS) expect(INSTALL_TAB_IDS).toContain(installTabForPlatform(platform));
  });

  test("uses the real install commands", () => {
    expect(INSTALL_OPTIONS.windows.command).toBe(site.installCommandWindows);
    expect(INSTALL_OPTIONS.npm.command).toBe(site.installCommandNpm);
    expect(installCommandForPlatform("windows")).toContain("install.ps1");
    expect(installCommandForPlatform("linux")).toContain("install.sh");
    expect(installCommandForPlatform("unknown")).toContain("install.sh");
  });
});
