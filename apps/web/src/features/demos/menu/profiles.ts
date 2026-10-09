import { PROFILE_GROUP_KEYS, type ProfileGroupKey } from "@/shared/contract";
import {
  ACTIVE_CLAUDE_PROFILE,
  ACTIVE_SUBSCRIPTIONS,
  CLAUDE_PROFILES,
  PROVIDER_PROFILES,
  SUBSCRIPTION_LOGINS,
  type ProviderProfileFixture,
  type SubscriptionLoginFixture,
} from "@/features/demos/data/fixtures";
import { PROFILE_GROUP_TITLES } from "@/features/demos/data/groups.gen";
import { SUBSCRIPTIONS, type SubscriptionTool } from "@/features/demos/data/subscriptions.gen";

export type MenuProfile = {
  id: string;
  group: ProfileGroupKey;
  name: string;
  hint: string;
};

export type MenuGroup = {
  key: ProfileGroupKey;
  title: string;
  profiles: readonly MenuProfile[];
};

export type CurrentByTool = Readonly<Partial<Record<SubscriptionTool, string>>>;

const GEMINI_LOGIN: SubscriptionLoginFixture = {
  tool: "gemini",
  name: "gemini",
  label: "sara@haddad.example",
  email: "sara@haddad.example",
  plan: null,
};

const MENU_SUBSCRIPTION_LOGINS: readonly SubscriptionLoginFixture[] = [...SUBSCRIPTION_LOGINS, GEMINI_LOGIN];

const SUBSCRIPTION_TOOL_SET: ReadonlySet<string> = new Set(SUBSCRIPTIONS.map((subscription) => subscription.tool));

export const isSubscriptionTool = (key: ProfileGroupKey): key is SubscriptionTool => SUBSCRIPTION_TOOL_SET.has(key);

const providerHint = (provider: ProviderProfileFixture): string =>
  provider.models.length <= 1
    ? `${provider.label} · ${provider.models[0] ?? provider.defaultModel}`
    : `${provider.label} · ${provider.models.length} models`;

const subscriptionHint = (login: SubscriptionLoginFixture): string =>
  login.plan === null ? login.label : `${login.label} · ${login.plan}`;

const toProfile = (group: ProfileGroupKey, name: string, hint: string): MenuProfile => ({
  id: `menu-profile-${group}-${name}`,
  group,
  name,
  hint,
});

const profilesFor = (key: ProfileGroupKey): MenuProfile[] => {
  if (key === "claude") return CLAUDE_PROFILES.map((profile) => toProfile(key, profile.name, profile.email));
  if (key === "external") return PROVIDER_PROFILES.map((provider) => toProfile(key, provider.name, providerHint(provider)));
  return MENU_SUBSCRIPTION_LOGINS.filter((login) => login.tool === key).map((login) =>
    toProfile(key, login.name, subscriptionHint(login)),
  );
};

export const MENU_GROUPS: readonly MenuGroup[] = PROFILE_GROUP_KEYS.map((key) => ({
  key,
  title: PROFILE_GROUP_TITLES[key],
  profiles: profilesFor(key),
})).filter((group) => group.profiles.length > 0);

export const MENU_PROFILES: readonly MenuProfile[] = MENU_GROUPS.flatMap((group) => group.profiles);

export const SHOW_GROUP_TITLES = MENU_GROUPS.length > 1;

export const INITIAL_CURRENT: string | null = ACTIVE_CLAUDE_PROFILE;

export const INITIAL_CURRENT_BY_TOOL: CurrentByTool = { ...ACTIVE_SUBSCRIPTIONS, [GEMINI_LOGIN.tool]: GEMINI_LOGIN.name };

export const groupTitle = (key: ProfileGroupKey): string => PROFILE_GROUP_TITLES[key];
