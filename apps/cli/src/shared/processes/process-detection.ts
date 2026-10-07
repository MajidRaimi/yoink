import { readdir } from "node:fs/promises";
import { basename } from "node:path";
import type { ProcessInfo, ProcessLister, ProcessMatcher } from "./types";

const WINDOWS_EXECUTABLE_SUFFIX = /\.exe$/i;
const PS_LINE = /^\s*(\d+)\s+(\S+)\s*(.*)$/;
const CSV_FIELD = /"([^"]*)"/g;

const normalizeName = (name: string): string => basename(name).replace(WINDOWS_EXECUTABLE_SUFFIX, "").toLowerCase();

const INTERPRETER_NAME = /^(node|nodejs|bun|deno|uv|uvx|python(\d+(\.\d+)?)?)$/;
const PATH_SEPARATORS = /[\\/]+/g;

const isOption = (argument: string): boolean => argument.startsWith("-");

const interpreterScript = (info: ProcessInfo): string | undefined => {
  const [interpreter, ...rest] = info.argv;
  if (interpreter === undefined || !INTERPRETER_NAME.test(normalizeName(interpreter))) return undefined;
  return rest.find((argument) => !isOption(argument));
};

const candidateNames = (info: ProcessInfo, script: string | undefined): string[] =>
  [info.name, info.argv[0], script].filter((name): name is string => name !== undefined).map(normalizeName);

const toSegmentPath = (path: string): string => `/${path.replace(PATH_SEPARATORS, "/").toLowerCase()}/`;

const scriptContainsSegment = (script: string, needle: string): boolean =>
  toSegmentPath(script).includes(toSegmentPath(needle));

const exactNameKey = (name: string): string =>
  WINDOWS_EXECUTABLE_SUFFIX.test(name) ? name.replace(WINDOWS_EXECUTABLE_SUFFIX, "").toLowerCase() : name;

export const matchesProcess = (matcher: ProcessMatcher, info: ProcessInfo): boolean => {
  if (matcher.exactName === true) return matcher.names.includes(exactNameKey(info.name));
  const wanted = new Set(matcher.names.map(normalizeName));
  const script = interpreterScript(info);
  if (candidateNames(info, script).some((name) => wanted.has(name))) return true;
  if (script === undefined) return false;
  const needles = matcher.argvContains ?? [];
  return needles.some((needle) => scriptContainsSegment(script, needle));
};

export const parseProcCmdline = (raw: string): string[] => raw.split("\0").filter((part) => part.length > 0);

export const parsePsOutput = (output: string): ProcessInfo[] =>
  output.split("\n").flatMap((line) => {
    const match = PS_LINE.exec(line);
    if (!match?.[1] || !match[2]) return [];
    const args = (match[3] ?? "").trim();
    return [{ pid: Number(match[1]), name: match[2], argv: args.length > 0 ? args.split(/\s+/) : [] }];
  });

export const parseTasklistProcesses = (output: string): ProcessInfo[] =>
  output.split("\n").flatMap((line) => {
    const fields = [...line.matchAll(CSV_FIELD)].map((match) => match[1] ?? "");
    const [name, pid] = fields;
    if (!name || !pid || !/^\d+$/.test(pid)) return [];
    return [{ pid: Number(pid), name, argv: [] }];
  });

const runCommand = async (argv: string[]): Promise<string | null> => {
  const proc = Bun.spawn(argv, { stdout: "pipe", stderr: "pipe" });
  const [output, exitCode] = await Promise.all([new Response(proc.stdout).text(), proc.exited, new Response(proc.stderr).text()]);
  return exitCode === 0 ? output : null;
};

const readProcEntry = async (pid: number): Promise<ProcessInfo | null> => {
  try {
    const [comm, cmdline] = await Promise.all([
      Bun.file(`/proc/${pid}/comm`).text(),
      Bun.file(`/proc/${pid}/cmdline`).text(),
    ]);
    return { pid, name: comm.trim(), argv: parseProcCmdline(cmdline) };
  } catch {
    return null;
  }
};

const listLinuxProcesses: ProcessLister = async () => {
  const pids = (await readdir("/proc")).filter((entry) => /^\d+$/.test(entry)).map(Number);
  const entries = await Promise.all(pids.map(readProcEntry));
  return entries.filter((entry): entry is ProcessInfo => entry !== null);
};

const listPsProcesses: ProcessLister = async () => {
  const output = await runCommand(["ps", "-A", "-o", "pid=,ucomm=,args="]);
  return output === null ? [] : parsePsOutput(output);
};

const listWindowsProcesses: ProcessLister = async () => {
  const output = await runCommand(["tasklist", "/FO", "CSV", "/NH"]);
  return output === null ? [] : parseTasklistProcesses(output);
};

export const createProcessLister = (platform: NodeJS.Platform): ProcessLister => {
  if (platform === "win32") return listWindowsProcesses;
  if (platform === "linux") return listLinuxProcesses;
  return listPsProcesses;
};

export const listProcesses: ProcessLister = createProcessLister(process.platform);

export const isProcessRunning = async (
  matcher: ProcessMatcher,
  lister: ProcessLister = listProcesses,
  ownPid: number = process.pid,
): Promise<boolean> => {
  try {
    const processes = await lister();
    return processes.some((info) => info.pid !== ownPid && matchesProcess(matcher, info));
  } catch {
    return false;
  }
};
