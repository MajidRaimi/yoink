import { cancel, note, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { promptConfirm } from "../../../shared/prompt";
import { syncCurrentProfile } from "../../switch/service";
import {
  captureLiveLogin,
  defaultNameFromEmail,
  runClaudeLogin,
  type LiveLogin,
} from "../../login/service";
import { listProfiles, saveProfile } from "../../profiles/service";
import { accountLabel } from "../../profiles/format";
import { findClaudeProfileByEmail, hasProfileForEmail } from "../../profiles/lookup";
import { uniqueName } from "../../profiles/naming";
import type { Profile } from "../../profiles/types";
import { promptProfileName } from "./prompt-name";

const preserveCurrentLogin = async (before: LiveLogin, profiles: Profile[]): Promise<void> => {
  if (before.keychain === null || hasProfileForEmail(profiles, before.email)) return;
  const loader = spinner();
  loader.start("Saving your current login first");
  const saved = await saveProfile(uniqueName(profiles, defaultNameFromEmail(before.email)));
  loader.stop(
    `Saved current login as ${theme.accent(saved.name)} ${pc.dim(`(${accountLabel(saved)})`)} — rename it anytime with \`yoink rename\`.`,
  );
};

export const addAccountFlow = async (): Promise<void> => {
  for (;;) {
    await syncCurrentProfile();
    const before = await captureLiveLogin();
    const { profiles } = await listProfiles();
    await preserveCurrentLogin(before, profiles);

    note("A browser window will open. Sign in to the account you want to add, then return here.", "Log in");
    try {
      await runClaudeLogin();
    } catch (error) {
      cancel(error instanceof Error ? error.message : "Login failed.");
      return;
    }

    const after = await captureLiveLogin();
    if (after.keychain === null) {
      cancel("No login detected after sign-in.");
      return;
    }
    if (before.keychain !== null && after.keychain === before.keychain) {
      cancel("No new account was added (the login is unchanged).");
      return;
    }

    const currentProfiles = (await listProfiles()).profiles;
    const existing = findClaudeProfileByEmail(currentProfiles, after.email);
    const defaultName = existing
      ? existing.name
      : uniqueName(currentProfiles, defaultNameFromEmail(after.email));
    const name = await promptProfileName(defaultName);
    if (name === null) {
      cancel("Cancelled.");
      return;
    }
    const loader = spinner();
    loader.start("Saving account");
    const profile = await saveProfile(name);
    loader.stop(
      `${theme.success("✔")} ${existing ? "Updated" : "Added"} ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`,
    );

    const again = await promptConfirm({ message: "Add another account?", initialValue: false });
    if (again !== true) {
      outro("Done.");
      return;
    }
  }
};
