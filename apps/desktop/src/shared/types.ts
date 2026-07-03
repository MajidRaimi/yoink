export type ClaudeProfile = {
  type: "claude";
  name: string;
  email: string | null;
  updatedAt: string;
};

export type ExternalProfile = {
  type: "external";
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  updatedAt: string;
};

export type Profile = ClaudeProfile | ExternalProfile;

export type Store = {
  current: string | null;
  profiles: Profile[];
};

export type ExternalInput = {
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  token?: string;
};

export type Settings = {
  hotkey: string;
  autostart: boolean;
};
