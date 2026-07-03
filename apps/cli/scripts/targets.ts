export type Target = {
  name: string;
  bunTarget: string;
  npmName: string;
  npmOs: "darwin" | "linux" | "win32";
  cpu: "arm64" | "x64";
  binaryName: "yoink" | "yoink.exe";
  archive: "tar.gz" | "zip";
};

export const targets: Target[] = [
  {
    name: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    npmName: "yoink-cli-darwin-arm64",
    npmOs: "darwin",
    cpu: "arm64",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    npmName: "yoink-cli-darwin-x64",
    npmOs: "darwin",
    cpu: "x64",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "linux-x64",
    bunTarget: "bun-linux-x64",
    npmName: "yoink-cli-linux-x64",
    npmOs: "linux",
    cpu: "x64",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    npmName: "yoink-cli-linux-arm64",
    npmOs: "linux",
    cpu: "arm64",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "windows-x64",
    bunTarget: "bun-windows-x64",
    npmName: "yoink-cli-win32-x64",
    npmOs: "win32",
    cpu: "x64",
    binaryName: "yoink.exe",
    archive: "zip",
  },
];

export const rawBinaryFile = (t: Target): string =>
  t.npmOs === "win32" ? `yoink-${t.name}.exe` : `yoink-${t.name}`;

export const archiveFile = (t: Target): string => `yoink-${t.name}.${t.archive}`;
