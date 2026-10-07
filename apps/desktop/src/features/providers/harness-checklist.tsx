import { useState, type ReactElement } from "react";
import type { ExternalProfile, HarnessStatus } from "@/shared/types";
import { ConfirmDialog, useEscapeKey } from "@/shared/ui/dialog";
import { ErrorText } from "@/shared/ui/error-text";
import { SlidersIcon } from "@/shared/ui/icons";
import { IconButton } from "@/shared/ui/button";
import { Segmented } from "@/shared/ui/segmented";
import { useAutoFocus } from "@/shared/ui/use-auto-focus";
import { useListNavigation } from "@/shared/ui/use-list-navigation";
import { ViewHeader } from "@/shared/ui/view-header";
import { useExternalProfile } from "@/shared/use-profiles-query";
import { useViewStore } from "@/shared/view-store";
import { HarnessRow } from "./harness-row";
import { ProviderModelsPanel } from "./provider-models-panel";
import { useClaudeGuard } from "./use-claude-guard";
import { useHarnessStatus } from "./use-harness-status";

type ProviderTab = "harnesses" | "models";

const TABS = [
  { value: "harnesses", label: "Harnesses" },
  { value: "models", label: "Models" },
] as const;

const modelCount = (count: number): string => `${count} ${count === 1 ? "model" : "models"}`;

const HarnessList = ({ profile }: { profile: ExternalProfile }): ReactElement => {
  const harness = useHarnessStatus(profile.name);
  const guard = useClaudeGuard(harness.toggle);
  const toggleAt = (status: HarnessStatus | undefined): void => {
    if (status) guard.request(status);
  };
  const focusRef = useAutoFocus<HTMLDivElement>();
  const navigation = useListNavigation({
    count: harness.statuses.length,
    onActivate: (index) => toggleAt(harness.statuses[index]),
  });

  return (
    <>
      <div
        ref={focusRef}
        tabIndex={0}
        role="listbox"
        aria-label="Harnesses"
        onKeyDown={navigation.handleKeyDown}
        className="-mx-1.5 min-h-0 flex-1 overflow-y-auto"
      >
        {harness.loading ? (
          <p className="px-3 py-6 text-center font-mono text-[11px] text-faint">Detecting harnesses</p>
        ) : (
          harness.statuses.map((status, index) => (
            <HarnessRow
              key={status.id}
              status={status}
              models={profile.models}
              active={index === navigation.active}
              pending={harness.isPending(status.id)}
              onHover={() => navigation.setActive(index)}
              onToggle={() => toggleAt(status)}
              onDefaultModel={(model) => harness.setDefaultModel(status.id, model)}
            />
          ))
        )}
      </div>
      <ErrorText message={harness.error} className="shrink-0 pt-2" />
      {guard.pending !== null && (
        <ConfirmDialog
          title="Claude Code is running"
          body={`A live session keeps its current provider until it restarts. Connect ${profile.name} anyway?`}
          confirmLabel="Connect anyway"
          onConfirm={guard.confirm}
          onCancel={guard.cancel}
        />
      )}
    </>
  );
};

export const HarnessChecklist = (): ReactElement => {
  const selectedProvider = useViewStore((state) => state.selectedProvider);
  const setView = useViewStore((state) => state.setView);
  const openExternalForm = useViewStore((state) => state.openExternalForm);
  const { profile, loading } = useExternalProfile(selectedProvider);
  const [tab, setTab] = useState<ProviderTab>("harnesses");
  useEscapeKey(() => setView("list"));

  return (
    <div className="rise flex min-h-0 flex-1 flex-col">
      <ViewHeader
        title={selectedProvider ?? "Provider"}
        subtitle={profile === null ? undefined : `${profile.provider} · ${modelCount(profile.models.length)}`}
        onBack={() => setView("list")}
        trailing={
          profile !== null && (
            <IconButton label="Edit name and key" onClick={() => openExternalForm(profile.name, "harnesses")}>
              <SlidersIcon />
            </IconButton>
          )
        }
      />
      {profile === null ? (
        <p className="px-4 py-6 text-center text-[12px] text-muted">
          {loading ? "Loading" : "This provider no longer exists."}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-3 pt-3 pb-3">
          <div className="shrink-0">
            <Segmented options={TABS} value={tab} onChange={setTab} />
          </div>
          {tab === "harnesses" ? (
            <HarnessList key={profile.name} profile={profile} />
          ) : (
            <ProviderModelsPanel key={profile.name} profile={profile} />
          )}
        </div>
      )}
    </div>
  );
};
