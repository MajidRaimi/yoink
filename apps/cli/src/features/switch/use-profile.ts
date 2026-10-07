import { YoinkError } from "../../shared/errors";
import { loadStore } from "../profiles/store";
import { isSubscriptionProfile } from "../profiles/subscription-profile";
import type { Profile, ProfileStore } from "../profiles/types";
import { switchSubscription, type SubscriptionSwitchResult, type SwitchSubscriptionOptions } from "../subscriptions/switch";
import { confirmIfClaudeRunning } from "./confirm-running";
import { assertSwitchable, switchTo, type SwitchResult } from "./service";

export type UseProfileOptions = { force?: boolean };

export type UseProfileOutcome =
  | { kind: "already"; profile: Profile; notice: string | null }
  | { kind: "cancelled" }
  | { kind: "switched"; profile: Profile; notice: string | null };

export type UseProfileDeps = {
  loadStore: () => Promise<ProfileStore>;
  assertClaudeSwitchable: (name: string) => Promise<void>;
  confirmClaudeRunning: () => Promise<boolean>;
  switchClaude: (name: string) => Promise<SwitchResult>;
  switchSubscription: (name: string, options?: SwitchSubscriptionOptions) => Promise<SubscriptionSwitchResult>;
};

export type UseProfile = (name: string, options?: UseProfileOptions) => Promise<UseProfileOutcome>;

export const createUseProfile =
  (deps: UseProfileDeps): UseProfile =>
  async (name, options = {}) => {
    const store = await deps.loadStore();
    const target = store.profiles[name];
    if (!target) throw new YoinkError(`No profile named "${name}". Run \`yoink list\` to see your profiles.`);

    if (isSubscriptionProfile(target)) {
      const { profile, switched, notice } = await deps.switchSubscription(name, { force: options.force === true });
      return { kind: switched ? "switched" : "already", profile, notice };
    }

    if (store.current === name) return { kind: "already", profile: target, notice: null };
    await deps.assertClaudeSwitchable(name);
    if (options.force !== true && !(await deps.confirmClaudeRunning())) return { kind: "cancelled" };
    const { profile } = await deps.switchClaude(name);
    return { kind: "switched", profile, notice: null };
  };

export const useProfile: UseProfile = createUseProfile({
  loadStore,
  assertClaudeSwitchable: assertSwitchable,
  confirmClaudeRunning: confirmIfClaudeRunning,
  switchClaude: switchTo,
  switchSubscription,
});
