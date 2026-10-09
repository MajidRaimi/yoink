import { describe, expect, test } from "bun:test";
import { site } from "@/shared/brand/site";
import { PLATFORMS } from "@/shared/contract";
import { INSTALL_OPTIONS, INSTALL_TAB_IDS, installTabForPlatform } from "./install-options";

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
    expect(INSTALL_OPTIONS[installTabForPlatform("windows")].command).toContain("install.ps1");
    expect(INSTALL_OPTIONS[installTabForPlatform("linux")].command).toContain("install.sh");
    expect(INSTALL_OPTIONS[installTabForPlatform("unknown")].command).toContain("install.sh");
  });
});
