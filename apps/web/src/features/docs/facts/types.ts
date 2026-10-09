import type { Protocol } from "@/shared/contract";

export type HarnessFactsData = {
  readonly id: string;
  readonly label: string;
  readonly protocols: readonly Protocol[];
  readonly experimental: boolean;
  readonly exclusive: boolean;
  readonly setsDefaultModel: boolean;
  readonly configPath: string;
  readonly format: string;
  readonly defaultModel: string;
  readonly envOverrides: readonly string[];
};

export type PresetEndpointFacts = {
  readonly protocol: Protocol;
  readonly baseUrl: string;
};

export type PresetReachFacts = {
  readonly harness: string;
  readonly protocol: Protocol | null;
};

export type PresetFactsData = {
  readonly id: string;
  readonly label: string;
  readonly keyUrl: string | null;
  readonly endpoints: readonly PresetEndpointFacts[];
  readonly reach: readonly PresetReachFacts[];
};
