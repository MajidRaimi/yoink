import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactElement, type RefCallback } from "react";
import { ipc, onPanelShown } from "@/shared/ipc";
import type { Profile } from "@/shared/types";
import { useTauriEvent } from "@/shared/use-tauri-event";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { useViewStore } from "@/shared/view-store";
import { ProfileRow } from "./profile-row";
import { SaveCurrentForm } from "./save-current-form";
import { SwitchConfirm } from "./switch-confirm";
import { useProfiles } from "./use-profiles";

const matchesQuery = (profile: Profile, term: string): boolean => {
  const fields =
    profile.type === "claude"
      ? [profile.name, profile.email ?? ""]
      : [profile.name, profile.provider];
  return fields.some((field) => field.toLowerCase().includes(term));
};

const EmptyState = () => (
  <div className="rise flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
    <p className="font-mono text-[13px] text-muted">No profiles yet</p>
    <p className="text-[11px] leading-relaxed text-faint">
      Save your current login from the + menu, or run{" "}
      <span className="font-mono text-brand-text">yoink add</span> in a terminal.
    </p>
  </div>
);

const useSearchFocus = (): RefCallback<HTMLInputElement> => {
  const searchRef = useRef<HTMLInputElement | null>(null);

  useTauriEvent<void>(onPanelShown, () => {
    searchRef.current?.focus();
    searchRef.current?.select();
  });

  return useCallback((node: HTMLInputElement | null) => {
    searchRef.current = node;
    node?.focus();
  }, []);
};

type ProfileListKeyActions = {
  enabled: boolean;
  onStep: (delta: number) => void;
  onActivate: () => void;
  onEscape: () => void;
};

const useProfileListKeys = (actions: ProfileListKeyActions): void => {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!actions.enabled) return;
    const typing = event.target instanceof HTMLInputElement;
    if (event.key === "ArrowDown" || (!typing && event.key === "j")) {
      event.preventDefault();
      actions.onStep(1);
    } else if (event.key === "ArrowUp" || (!typing && event.key === "k")) {
      event.preventDefault();
      actions.onStep(-1);
    } else if (event.key === "Enter") {
      if (event.target instanceof HTMLButtonElement) return;
      actions.onActivate();
    } else if (event.key === "Escape") {
      actions.onEscape();
    }
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => onKeyDown(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
};

export const ProfileList = (): ReactElement => {
  const { store, error, switchTo, rename, remove, saveCurrent } = useProfiles();
  const openExternalForm = useViewStore((state) => state.openExternalForm);
  const openHarnesses = useViewStore((state) => state.openHarnesses);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const searchRef = useSearchFocus();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term.length === 0
      ? store.profiles
      : store.profiles.filter((profile) => matchesQuery(profile, term));
  }, [store.profiles, query]);

  const selected = filtered.length === 0 ? -1 : Math.min(selectedIndex, filtered.length - 1);
  const dialogOpen = pendingSwitch !== null || pendingDelete !== null;

  const requestSwitch = async (name: string) => {
    if (name === store.current) return;
    const running = await ipc.isClaudeRunning().catch(() => false);
    if (running) setPendingSwitch(name);
    else void switchTo(name);
  };

  const activate = (profile: Profile): void => {
    if (profile.type === "external") openHarnesses(profile.name);
    else void requestSwitch(profile.name);
  };

  useProfileListKeys({
    enabled: !dialogOpen,
    onStep: (delta) => setSelectedIndex(Math.max(0, Math.min(selected + delta, filtered.length - 1))),
    onActivate: () => {
      const profile = filtered[selected];
      if (profile) activate(profile);
    },
    onEscape: () => {
      if (query.length > 0) setQuery("");
      else void ipc.hidePanel();
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-3 pt-3 pb-2">
        <Input
          ref={searchRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search profiles"
          className="py-1.5"
        />
      </div>
      <SaveCurrentForm onSave={saveCurrent} />
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {store.profiles.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted">No matches for "{query}"</p>
        ) : (
          filtered.map((profile, index) => (
            <ProfileRow
              key={profile.name}
              profile={profile}
              active={profile.name === store.current}
              selected={index === selected}
              index={index}
              onHover={() => setSelectedIndex(index)}
              onActivate={() => activate(profile)}
              onRename={(to) => void rename(profile.name, to)}
              onEdit={profile.type === "external" ? () => openExternalForm(profile.name) : null}
              onDelete={() => setPendingDelete(profile.name)}
            />
          ))
        )}
      </div>
      {error !== null && (
        <p className="shrink-0 px-3.5 pb-2 font-mono text-[11px] text-[#f87171]">{error}</p>
      )}
      {pendingSwitch !== null && (
        <SwitchConfirm
          name={pendingSwitch}
          onConfirm={() => {
            setPendingSwitch(null);
            void switchTo(pendingSwitch);
          }}
          onCancel={() => setPendingSwitch(null)}
        />
      )}
      {pendingDelete !== null && (
        <ConfirmDialog
          title={`Delete profile ${pendingDelete}?`}
          body="This removes the saved snapshot. It does not log anything out."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            setPendingDelete(null);
            void remove(pendingDelete);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};
