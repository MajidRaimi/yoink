import { cancel, isCancel, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../shared/theme";
import { assertNever } from "../../shared/assert-never";
import { switchTo } from "../switch/service";
import { confirmIfClaudeRunning } from "../switch/confirm-running";
import { captureLiveLogin, defaultNameFromEmail } from "../login/service";
import { listProfiles } from "../profiles/service";
import { accountLabel } from "../profiles/format";
import type { Profile } from "../profiles/types";
import { actionList, type ListOption, type ListResult } from "./action-list";
import { introBanner } from "./banner";
import { printPlainFallback } from "./plain-fallback";
import { addAccountMenu } from "./flows/add-account-menu";
import { editProfileFlow } from "./flows/edit-flow";
import { confirmAndRemove } from "./flows/remove-flow";
import { saveCurrentLogin } from "./flows/save-login-flow";

const toListOptions = (current: string | null, profiles: Profile[]): ListOption[] =>
  profiles.map((profile) => ({
    name: profile.name,
    label: current === profile.name ? theme.active(profile.name) : profile.name,
    hint: accountLabel(profile),
    isCurrent: current === profile.name,
  }));

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
  loader.stop(
    `${theme.success("✔")} Switched to ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`,
  );
  outro("Done.");
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

const dispatch = async (result: ListResult, current: string | null): Promise<void> => {
  switch (result.action) {
    case "switch":
      return runSwitch(result.name, current);
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
    const { current, profiles } = await listProfiles();
    printPlainFallback(current, profiles);
    return;
  }

  for (;;) {
    const { current, profiles } = await listProfiles();
    const result = await actionList({
      options: toListOptions(current, profiles),
      initialName: current ?? undefined,
    });
    if (isCancel(result)) return;
    await dispatch(result, current);
  }
};
