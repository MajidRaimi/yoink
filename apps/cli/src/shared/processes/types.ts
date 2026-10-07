export type ProcessMatcher = {
  names: readonly string[];
  argvContains?: readonly string[];
  exactName?: boolean;
};

export type ProcessInfo = {
  pid: number;
  name: string;
  argv: readonly string[];
};

export type ProcessLister = () => Promise<ProcessInfo[]>;
