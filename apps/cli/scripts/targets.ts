export type Target = {
  name: string;
  bunTarget: string;
  npmName: string;
  npmOs: "darwin" | "linux" | "win32";
  cpu: "arm64" | "x64";
  libc?: "glibc" | "musl";
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
    libc: "glibc",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    npmName: "yoink-cli-linux-arm64",
    npmOs: "linux",
    cpu: "arm64",
    libc: "glibc",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "linux-x64-musl",
    bunTarget: "bun-linux-x64-musl",
    npmName: "yoink-cli-linux-x64-musl",
    npmOs: "linux",
    cpu: "x64",
    libc: "musl",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "linux-arm64-musl",
    bunTarget: "bun-linux-arm64-musl",
    npmName: "yoink-cli-linux-arm64-musl",
    npmOs: "linux",
    cpu: "arm64",
    libc: "musl",
    binaryName: "yoink",
    archive: "tar.gz",
  },
  {
    name: "windows-x64",
    bunTarget: "bun-windows-x64",
    npmName: "yoink-cli-windows-x64",
    npmOs: "win32",
    cpu: "x64",
    binaryName: "yoink.exe",
    archive: "zip",
  },
  {
    name: "windows-arm64",
    bunTarget: "bun-windows-arm64",
    npmName: "yoink-cli-windows-arm64",
    npmOs: "win32",
    cpu: "arm64",
    binaryName: "yoink.exe",
    archive: "zip",
  },
];

export const rawBinaryFile = (t: Target): string =>
  t.npmOs === "win32" ? `yoink-${t.name}.exe` : `yoink-${t.name}`;

export const archiveFile = (t: Target): string => `yoink-${t.name}.${t.archive}`;
