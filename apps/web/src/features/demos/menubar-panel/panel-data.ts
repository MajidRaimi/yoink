import {
  ACTIVE_CLAUDE_PROFILE,
  CLAUDE_PROFILES,
  FUSE_PROVIDER,
  HARNESS_CONFIG_PATHS,
  PROVIDER_PROFILES,
} from "@/features/demos/data/fixtures";
import { HARNESSES, type Harness, type HarnessId } from "@/features/demos/data/harnesses.gen";
import { PROTOCOL_LABELS, type Protocol } from "@/shared/contract";

export type ClaudePanelProfile = {
  type: "claude";
  name: string;
  email: string;
};

export type ProviderPanelProfile = {
  type: "external";
  name: string;
  provider: string;
  protocol: Protocol;
  models: readonly string[];
};

export type PanelProfile = ClaudePanelProfile | ProviderPanelProfile;

export type ProviderLinks = {
  connections: readonly HarnessId[];
  defaults: Readonly<Partial<Record<HarnessId, string>>>;
};

export const PANEL_PROFILES: readonly PanelProfile[] = [
  ...CLAUDE_PROFILES.map(
    (profile): ClaudePanelProfile => ({ type: "claude", name: profile.name, email: profile.email }),
  ),
  ...PROVIDER_PROFILES.map(
    (profile): ProviderPanelProfile => ({
      type: "external",
      name: profile.name,
      provider: profile.label,
      protocol: profile.protocol,
      models: profile.models,
    }),
  ),
];

export const INITIAL_CURRENT = ACTIVE_CLAUDE_PROFILE;

export const INITIAL_LINKS: Readonly<Record<string, ProviderLinks>> = Object.fromEntries(
  PROVIDER_PROFILES.map((profile): [string, ProviderLinks] =>
    profile.name === FUSE_PROVIDER.name
      ? [profile.name, { connections: ["pi", "crush"], defaults: { pi: profile.defaultModel } }]
      : [profile.name, { connections: ["droid"], defaults: {} }],
  ),
);

export const NOT_INSTALLED: ReadonlySet<HarnessId> = new Set<HarnessId>(["goose", "continue"]);

export const WITHOUT_DEFAULT_MODEL: ReadonlySet<HarnessId> = new Set<HarnessId>(["droid"]);

export const HARNESS_ORDER: readonly HarnessId[] = HARNESSES.map((harness) => harness.id);

export const harnessLabel = (id: HarnessId): string => HARNESSES.find((harness) => harness.id === id)?.label ?? id;

export const configPathFor = (id: HarnessId): string => HARNESS_CONFIG_PATHS[id];

export const supportsProtocol = (harness: Harness, protocol: Protocol): boolean =>
  harness.protocols.some((candidate) => candidate === protocol);

export const protocolRequirement = (harness: Harness): string =>
  `Needs ${harness.protocols.map((protocol) => PROTOCOL_LABELS[protocol]).join(" or ")}`;
