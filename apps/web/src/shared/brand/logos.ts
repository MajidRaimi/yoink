import {
  siClaude,
  siClaudecode,
  siDeepseek,
  siKimi,
  siMoonshotai,
  siOllama,
  siOpencode,
  siOpenrouter,
  siQwen,
  siZedindustries,
  type SimpleIcon,
} from "simple-icons";

export type LogoSource =
  | { kind: "path"; path: string; viewBox: "0 0 24 24" }
  | { kind: "file"; src: `/logos/${string}.svg` };

export type BrandLogo = {
  id: string;
  title: string;
  source: LogoSource;
};

const fromSimpleIcon = (id: string, icon: SimpleIcon, title: string = icon.title): BrandLogo => ({
  id,
  title,
  source: { kind: "path", path: icon.path, viewBox: "0 0 24 24" },
});

const fromFile = (id: string, title: string, src: `/logos/${string}.svg`): BrandLogo => ({
  id,
  title,
  source: { kind: "file", src },
});

export const HARNESS_LOGOS = {
  "claude-code": fromSimpleIcon("claude-code", siClaudecode, "Claude Code"),
  opencode: fromSimpleIcon("opencode", siOpencode, "opencode"),
  qwen: fromSimpleIcon("qwen", siQwen, "Qwen Code"),
  zed: fromSimpleIcon("zed", siZedindustries, "Zed"),
  "claude-desktop": fromSimpleIcon("claude-desktop", siClaude, "Claude Desktop"),
} as const satisfies Readonly<Record<string, BrandLogo>>;

export const PROVIDER_LOGOS = {
  "kimi-code": fromSimpleIcon("kimi-code", siKimi, "Kimi Code"),
  moonshot: fromSimpleIcon("moonshot", siMoonshotai, "Moonshot AI"),
  openrouter: fromSimpleIcon("openrouter", siOpenrouter, "OpenRouter"),
  deepseek: fromSimpleIcon("deepseek", siDeepseek, "DeepSeek"),
  zai: fromFile("zai", "Z.ai", "/logos/zai.svg"),
  ollama: fromSimpleIcon("ollama", siOllama, "Ollama"),
} as const satisfies Readonly<Record<string, BrandLogo>>;

export const LOGO_WALL: readonly BrandLogo[] = [
  ...Object.values(HARNESS_LOGOS),
  ...Object.values(PROVIDER_LOGOS),
];
