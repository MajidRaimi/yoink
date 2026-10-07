import { cancel, log, note, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { errorMessage } from "../../../shared/errors";
import { theme } from "../../../shared/theme";
import { promptConfirm } from "../../../shared/prompt";
import { accountLabel, PROFILE_GROUP_TITLES } from "../../profiles/format";
import type { SubscriptionTool } from "../../profiles/types";
import {
  describeFailedLogin,
  loginChanged,
  prepareSubscriptionLogin,
  runPreparedLogin,
  type LoginPreparation,
} from "../../subscriptions/add-login";
import { captureForAdd, postSwitchNotice, saveSubscription, type PreserveResult } from "../../subscriptions/switch";
import { preservedLoginNote } from "./preserved-login-note";
import { promptProfileName } from "./prompt-name";

const LOGIN_HINTS: Readonly<Record<SubscriptionTool, string>> = {
  codex: "Codex will open a browser window. Sign in to the ChatGPT account you want to add, then return here.",
  kimi: "Kimi Code will ask you to sign in. Finish the sign-in, then return here.",
  gemini: "Gemini will start. Run /auth, sign in with the Google account you want to add, then quit with /quit.",
  copilot: "Copilot will ask you to sign in with GitHub. Finish the device login, then return here.",
};

const reportPreserved = (preserved: PreserveResult): void => {
  if (preserved.kind !== "saved") return;
  note(preservedLoginNote(preserved.profile), "Kept your current login");
};

const prepare = async (tool: SubscriptionTool): Promise<LoginPreparation | null> => {
  try {
    return await prepareSubscriptionLogin(tool);
  } catch (error) {
    cancel(errorMessage(error, "Could not prepare the login."));
    return null;
  }
};

const login = async (preparation: LoginPreparation): Promise<boolean> => {
  const tool = preparation.backend.tool;
  note(LOGIN_HINTS[tool], "Log in");
  try {
    const after = await runPreparedLogin(preparation);
    if (after === null) {
      cancel(describeFailedLogin(preparation, new Error("No login detected after sign-in.")));
      return false;
    }
    if (!loginChanged(preparation.before, after)) {
      cancel("No new account was added (the login is unchanged).");
      return false;
    }
    return true;
  } catch (error) {
    cancel(describeFailedLogin(preparation, error));
    return false;
  }
};

const nameAndSave = async (tool: SubscriptionTool): Promise<boolean> => {
  const candidate = await captureForAdd(tool);
  if (candidate === null) {
    cancel("No login detected after sign-in.");
    return false;
  }
  const name = await promptProfileName(candidate.suggestedName);
  if (name === null) {
    cancel("Cancelled.");
    return false;
  }
  const loader = spinner();
  loader.start("Saving login");
  const profile = await saveSubscription(tool, name);
  const verb = candidate.existing?.name === profile.name ? "Updated" : "Added";
  loader.stop(`${theme.success("✔")} ${verb} ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`);
  const notice = postSwitchNotice(tool);
  if (notice !== null) log.warn(notice);
  return true;
};

export const addSubscriptionFlow = async (tool: SubscriptionTool): Promise<void> => {
  for (;;) {
    const preparation = await prepare(tool);
    if (preparation === null) return;
    reportPreserved(preparation.preserved);
    if (!(await login(preparation))) return;
    if (!(await nameAndSave(tool))) return;

    const again = await promptConfirm({
      message: `Add another ${PROFILE_GROUP_TITLES[tool]} login?`,
      initialValue: false,
    });
    if (again !== true) {
      outro("Done.");
      return;
    }
  }
};
