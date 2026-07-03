import pc from "picocolors";

export const theme = {
  accent: (s: string) => pc.yellow(s),
  badge: (s: string) => pc.bgYellow(pc.black(s)),
  active: (s: string) => pc.green(s),
  success: (s: string) => pc.green(s),
  warn: (s: string) => pc.yellow(s),
  error: (s: string) => pc.red(s),
};
