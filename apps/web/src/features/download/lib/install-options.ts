import type { Platform } from "@/shared/contract";
import { site } from "@/shared/brand/site";

export const INSTALL_TAB_IDS = ["macos", "linux", "windows", "npm"] as const;

export type InstallTabId = (typeof INSTALL_TAB_IDS)[number];

export type CopySegment = string | { readonly code: string };

export type CopyLine = readonly CopySegment[];

export type InstallOption = {
  id: InstallTabId;
  label: string;
  command: string;
  prompt: string;
  detail: CopyLine;
  requirement: CopyLine;
};

const unixScriptDetail: CopyLine = [
  "Downloads the binary for your OS and architecture from the latest GitHub release, verifies its SHA-256 checksum when the release ships one and installs it to ",
  { code: "/usr/local/bin" },
  " or ",
  { code: "~/.local/bin" },
  ".",
];

export const INSTALL_OPTIONS: Readonly<Record<InstallTabId, InstallOption>> = {
  macos: {
    id: "macos",
    label: "macOS",
    command: site.installCommand,
    prompt: "$",
    detail: unixScriptDetail,
    requirement: ["Apple Silicon and Intel. The menu bar app needs macOS 12 or later."],
  },
  linux: {
    id: "linux",
    label: "Linux",
    command: site.installCommand,
    prompt: "$",
    detail: unixScriptDetail,
    requirement: ["x64 and arm64, glibc and musl. On bare Alpine, run ", { code: "apk add libstdc++ libgcc" }, " once."],
  },
  windows: {
    id: "windows",
    label: "Windows",
    command: site.installCommandWindows,
    prompt: ">",
    detail: [
      "Installs ",
      { code: "yoink.exe" },
      " to ",
      { code: "%LOCALAPPDATA%\\Programs\\yoink" },
      " and adds it to your user ",
      { code: "PATH" },
      ".",
    ],
    requirement: ["x64 and arm64."],
  },
  npm: {
    id: "npm",
    label: "npm",
    command: site.installCommandNpm,
    prompt: "$",
    detail: ["Works on any OS with Node. The package runs the prebuilt binary for your platform."],
    requirement: ["Node on macOS, Linux or Windows, x64 and arm64."],
  },
};

export const VERIFY_COMMAND = "yoink version";

const tabByPlatform: Readonly<Record<Platform, InstallTabId>> = {
  mac: "macos",
  linux: "linux",
  windows: "windows",
  unknown: "macos",
};

export const installTabForPlatform = (platform: Platform): InstallTabId => tabByPlatform[platform];
