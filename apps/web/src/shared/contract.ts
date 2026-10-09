import type { DocAlias, DocSlug } from "@/shared/lib/routes";

export type { DocAlias, DocSlug };

export const DEMO_IDS = ["menu", "provider-add", "subscription-switch", "menubar-panel"] as const;

export type DemoId = (typeof DEMO_IDS)[number];

export const DEMO_KEYS = ["up", "down", "left", "right", "enter", "space", "escape", "backspace", "tab"] as const;

export type DemoKey = (typeof DEMO_KEYS)[number];

export type DemoEvent =
  | { type: "key"; key: DemoKey }
  | { type: "text"; value: string }
  | { type: "reset" };

export type Step = {
  wait: number;
  event: DemoEvent;
};

export type DemoDefinition<State> = {
  id: DemoId;
  label: string;
  initial: State;
  reduce: (state: State, event: DemoEvent) => State;
  script: readonly Step[];
};

export type DemoMode = "idle" | "auto" | "done" | "user";

export type DemoSlotProps = {
  id: DemoId;
  eager?: boolean;
  linked?: boolean;
  className?: string;
};

export const DOC_SECTIONS = ["Start", "Switch", "Connect", "Understand", "Reference"] as const;

export type DocSection = (typeof DOC_SECTIONS)[number];

export type DocMeta = {
  slug: DocSlug;
  title: string;
  description: string;
  nav: string;
  order: number;
  section: DocSection;
  demo?: DemoId;
};

export type DocHeading = {
  id: string;
  text: string;
  depth: 2 | 3;
};

export const PLATFORMS = ["mac", "windows", "linux", "unknown"] as const;

export type Platform = (typeof PLATFORMS)[number];

export type DesktopDmgUrls = {
  readonly arm64: string;
  readonly x64: string;
};

export type DesktopReleaseInfo = {
  readonly version: string;
  readonly dmg: DesktopDmgUrls;
};

export type ReleaseInfo = {
  readonly cli: string;
  readonly desktop: DesktopReleaseInfo;
};

export const PROTOCOLS = ["anthropic-messages", "openai-chat", "openai-responses"] as const;

export type Protocol = (typeof PROTOCOLS)[number];

export type HarnessData = {
  readonly id: string;
  readonly label: string;
  readonly protocols: readonly Protocol[];
  readonly experimental: boolean;
  readonly exclusive: boolean;
};

export type EndpointData = {
  readonly protocol: Protocol;
  readonly baseUrl: string;
};

export type PresetData = {
  readonly id: string;
  readonly label: string;
  readonly endpoints: readonly EndpointData[];
  readonly keyUrl?: string | null;
};

export type SubscriptionData = {
  readonly tool: string;
  readonly label: string;
};

export const PROFILE_GROUP_KEYS = ["claude", "external", "codex", "kimi", "gemini", "copilot"] as const;

export type ProfileGroupKey = (typeof PROFILE_GROUP_KEYS)[number];

export type ProfileGroupData = Readonly<Record<ProfileGroupKey, string>>;

export type CtaLabel = "Download for Mac" | "Install the CLI" | "Read the docs" | "Star on GitHub";
