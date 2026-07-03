import type { OauthAccount } from "../../shared/claude-config";

export type ClaudeProfile = {
  type: "claude";
  name: string;
  keychain: string;
  account: OauthAccount | null;
  updatedAt: string;
};

export type ExternalProfile = {
  type: "external";
  name: string;
  provider: string;
  baseUrl: string;
  token: string;
  model: string;
  updatedAt: string;
};

export type Profile = ClaudeProfile | ExternalProfile;

export type ProfileStore = {
  current: string | null;
  profiles: Record<string, Profile>;
};
