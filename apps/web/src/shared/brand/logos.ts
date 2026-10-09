import {
  siAnthropic,
  siClaude,
  siClaudecode,
  siDeepseek,
  siGithub,
  siGithubcopilot,
  siGooglegemini,
  siKimi,
  siMoonshotai,
  siNpm,
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
  anthropic: fromSimpleIcon("anthropic", siAnthropic, "Anthropic"),
  "kimi-code": fromSimpleIcon("kimi-code", siKimi, "Kimi Code"),
  moonshot: fromSimpleIcon("moonshot", siMoonshotai, "Moonshot AI"),
  openrouter: fromSimpleIcon("openrouter", siOpenrouter, "OpenRouter"),
  deepseek: fromSimpleIcon("deepseek", siDeepseek, "DeepSeek"),
  zai: fromFile("zai", "Z.ai", "/logos/zai.svg"),
  ollama: fromSimpleIcon("ollama", siOllama, "Ollama"),
} as const satisfies Readonly<Record<string, BrandLogo>>;

export const SUBSCRIPTION_LOGOS = {
  claude: fromSimpleIcon("claude", siClaude, "Claude"),
  kimi: fromSimpleIcon("kimi", siKimi, "Kimi Code"),
  gemini: fromSimpleIcon("gemini", siGooglegemini, "Gemini"),
  copilot: fromSimpleIcon("copilot", siGithubcopilot, "GitHub Copilot"),
} as const satisfies Readonly<Record<string, BrandLogo>>;

export const SITE_LOGOS = {
  github: fromSimpleIcon("github", siGithub, "GitHub"),
  npm: fromSimpleIcon("npm", siNpm, "npm"),
} as const satisfies Readonly<Record<string, BrandLogo>>;

export type HarnessLogoId = keyof typeof HARNESS_LOGOS;
export type ProviderLogoId = keyof typeof PROVIDER_LOGOS;
export type SubscriptionLogoId = keyof typeof SUBSCRIPTION_LOGOS;

const lookup = <T extends Readonly<Record<string, BrandLogo>>>(table: T, id: string): BrandLogo | undefined =>
  Object.hasOwn(table, id) ? table[id] : undefined;

export const harnessLogo = (id: string): BrandLogo | undefined => lookup(HARNESS_LOGOS, id);

export const providerLogo = (id: string): BrandLogo | undefined => lookup(PROVIDER_LOGOS, id);

export const subscriptionLogo = (tool: string): BrandLogo | undefined => lookup(SUBSCRIPTION_LOGOS, tool);

export const LOGO_WALL: readonly BrandLogo[] = [
  ...Object.values(HARNESS_LOGOS),
  ...Object.values(PROVIDER_LOGOS),
  SUBSCRIPTION_LOGOS.gemini,
  SUBSCRIPTION_LOGOS.copilot,
];
