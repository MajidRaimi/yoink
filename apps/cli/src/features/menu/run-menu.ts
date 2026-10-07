import { cancel, log, outro, spinner } from "@clack/prompts";
import { assertNever } from "../../shared/assert-never";
import { switchTo } from "../switch/service";
import { confirmIfClaudeRunning } from "../switch/confirm-running";
import { captureLiveLogin, defaultNameFromEmail } from "../login/service";
import { PROFILE_GROUP_TITLES, switchedLine } from "../profiles/format";
import { loadProfileOverview, type ProfileOverview } from "../profiles/overview";
import { isSubscriptionProfile } from "../profiles/subscription-profile";
import type { SubscriptionProfile } from "../profiles/types";
import { SubscriptionSwitchRefusedError, switchSubscription } from "../subscriptions/switch";
import { actionList, type ListResult } from "./action-list";
import { toListOptions } from "./list-options";
import { introBanner } from "./banner";
import { printPlainFallback } from "./plain-fallback";
import { addAccountMenu } from "./flows/add-account-menu";
import { editProfileFlow } from "./flows/edit-flow";
import { confirmAndRemove } from "./flows/remove-flow";
import { saveCurrentLogin } from "./flows/save-login-flow";
import { manageProviderHarnesses } from "./flows/harness-flow";
import { offerImport } from "./flows/import-flow";
import { wasImportOffered } from "../profiles/import-flag";

const runSwitch = async (name: string, current: string | null): Promise<void> => {
  if (name === current) return;
  introBanner("switch Claude accounts");
  if (!(await confirmIfClaudeRunning())) {
    cancel("Switch cancelled.");
    return;
  }
  const loader = spinner();
  loader.start(`Switching to ${name}`);
  const { profile } = await switchTo(name);
  loader.stop(switchedLine(profile));
  outro("Done.");
};

const runSubscriptionSwitch = async (target: SubscriptionProfile, overview: ProfileOverview): Promise<void> => {
  if (overview.currentByTool?.[target.type] === target.name) return;
  introBanner(`switch ${PROFILE_GROUP_TITLES[target.type]} logins`);
  try {
    const { profile, notice } = await switchSubscription(target.name);
    if (notice !== null) log.warn(notice);
    outro(switchedLine(profile));
  } catch (error) {
    if (!(error instanceof SubscriptionSwitchRefusedError)) throw error;
    cancel("Switch cancelled.");
  }
};

const runAdd = async (): Promise<void> => {
  introBanner("add an account");
  await addAccountMenu();
};

const runEdit = async (name: string): Promise<void> => {
  introBanner("edit a profile");
  await editProfileFlow(name);
};

const runSave = async (): Promise<void> => {
  introBanner("save current login");
  const before = await captureLiveLogin();
  if ((await saveCurrentLogin(defaultNameFromEmail(before.email))) === null) cancel("Cancelled.");
  else outro("Done.");
};

const runRemove = async (name: string): Promise<void> => {
  introBanner("remove a profile");
  await confirmAndRemove(name);
};

const runProviderHarnesses = async (name: string): Promise<void> => {
  introBanner("connect a provider");
  await manageProviderHarnesses(name);
};

const dispatch = async (result: ListResult, overview: ProfileOverview): Promise<void> => {
  switch (result.action) {
    case "switch": {
      const target = overview.profiles.find((profile) => profile.name === result.name);
      if (target?.type === "external") return runProviderHarnesses(result.name);
      if (target && isSubscriptionProfile(target)) return runSubscriptionSwitch(target, overview);
      return runSwitch(result.name, overview.current);
    }
    case "add":
      return runAdd();
    case "edit":
      return runEdit(result.name);
    case "save":
      return runSave();
    case "delete":
      return runRemove(result.name);
    default:
      return assertNever(result);
  }
};

export const runMenu = async (): Promise<void> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    printPlainFallback(await loadProfileOverview());
    return;
  }

  if (!(await wasImportOffered())) {
    introBanner("import providers");
    await offerImport();
  }

  for (;;) {
    const overview = await loadProfileOverview();
    const result = await actionList({
      options: toListOptions(overview),
      initialName: overview.current ?? undefined,
    });
    if (typeof result === "symbol") return;
    await dispatch(result, overview);
  }
};
