import { errorMessage, YoinkError } from "../../shared/errors";
import type { SubscriptionSnapshot, SubscriptionTool } from "../profiles/types";
import { runSubscriptionLogin } from "./login";
import { requireBackend, SUBSCRIPTION_BACKENDS } from "./registry";
import { preserveLiveLogin, syncCurrentSubscription, type PreserveResult } from "./switch";
import type { SubscriptionBackend, SubscriptionCapture } from "./types";

export type LoginPreparation = {
  backend: SubscriptionBackend;
  preserved: PreserveResult;
  before: SubscriptionCapture | null;
};

export type SubscriptionLoginDeps = {
  backends: readonly SubscriptionBackend[];
  syncCurrentSubscription: (tool: SubscriptionTool) => Promise<void>;
  preserveLiveLogin: (tool: SubscriptionTool) => Promise<PreserveResult>;
  runLogin: (backend: SubscriptionBackend) => Promise<void>;
};

export type SubscriptionLoginService = {
  prepareSubscriptionLogin: (tool: SubscriptionTool) => Promise<LoginPreparation>;
  runPreparedLogin: (preparation: LoginPreparation) => Promise<SubscriptionCapture | null>;
  restoreAfterFailedLogin: (preparation: LoginPreparation) => Promise<void>;
};

export class RestoreFailedError extends YoinkError {
  readonly holderName: string | null;

  constructor(label: string, failure: string, restoreError: unknown, holderName: string | null) {
    const recovery =
      holderName === null
        ? "Your previous login could not be put back."
        : `Your previous login is still saved as ${holderName}. Run \`yoink use ${holderName}\` to bring it back.`;
    super(`${failure} Restoring the previous ${label} login also failed: ${errorMessage(restoreError)}. ${recovery}`);
    this.name = "RestoreFailedError";
    this.holderName = holderName;
  }
}

const previousLoginHolder = (preserved: PreserveResult): string | null =>
  preserved.kind === "none" ? null : preserved.profile.name;

const snapshotKey = (snapshot: SubscriptionSnapshot): string => {
  const sorted = (record: Record<string, string> | undefined): [string, string][] =>
    Object.entries(record ?? {}).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify([sorted(snapshot.files), sorted(snapshot.keyring)]);
};

export const loginChanged = (before: SubscriptionCapture | null, after: SubscriptionCapture): boolean =>
  before === null || snapshotKey(before.snapshot) !== snapshotKey(after.snapshot);

export const describeFailedLogin = (preparation: LoginPreparation, error: unknown): string => {
  const message = errorMessage(error, "Login failed.");
  if (error instanceof RestoreFailedError || preparation.before === null) return message;
  return `${message} Your previous login was restored.`;
};

export const createSubscriptionLoginService = (deps: SubscriptionLoginDeps): SubscriptionLoginService => {
  const restoreAfterFailedLogin = async (preparation: LoginPreparation): Promise<void> => {
    const restoredByBackend = (await preparation.backend.restoreAfterFailedLogin?.()) ?? false;
    if (restoredByBackend || preparation.before === null) return;
    await preparation.backend.restore(preparation.before.snapshot);
  };

  const restoreOrReport = async (preparation: LoginPreparation, failure: string): Promise<void> => {
    try {
      await restoreAfterFailedLogin(preparation);
    } catch (restoreError) {
      throw new RestoreFailedError(
        preparation.backend.label,
        failure,
        restoreError,
        previousLoginHolder(preparation.preserved),
      );
    }
  };

  const withRestoreOnFailure = async <T>(preparation: LoginPreparation, action: () => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      await restoreOrReport(preparation, errorMessage(error, "Login failed."));
      throw error;
    }
  };

  const prepareSubscriptionLogin = async (tool: SubscriptionTool): Promise<LoginPreparation> => {
    const backend = requireBackend(tool, deps.backends);
    await deps.syncCurrentSubscription(tool);
    const preserved = await deps.preserveLiveLogin(tool);
    const preparation: LoginPreparation = { backend, preserved, before: await backend.capture() };
    await withRestoreOnFailure(preparation, () => backend.prepareLogin());
    return preparation;
  };

  const runPreparedLogin = async (preparation: LoginPreparation): Promise<SubscriptionCapture | null> => {
    const after = await withRestoreOnFailure(preparation, async () => {
      await deps.runLogin(preparation.backend);
      return preparation.backend.capture();
    });
    if (after === null) {
      await restoreOrReport(preparation, "No login detected after sign-in.");
      return null;
    }
    await preparation.backend.finishLogin?.();
    return after;
  };

  return { prepareSubscriptionLogin, runPreparedLogin, restoreAfterFailedLogin };
};

const defaultLoginService = createSubscriptionLoginService({
  backends: SUBSCRIPTION_BACKENDS,
  syncCurrentSubscription,
  preserveLiveLogin,
  runLogin: runSubscriptionLogin,
});

export const prepareSubscriptionLogin = defaultLoginService.prepareSubscriptionLogin;
export const runPreparedLogin = defaultLoginService.runPreparedLogin;
export const restoreAfterFailedLogin = defaultLoginService.restoreAfterFailedLogin;
