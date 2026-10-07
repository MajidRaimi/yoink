import { useState, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { HarnessChips } from "@/shared/ui/harness-chips";
import type { Profile } from "@/shared/types";
import { cn } from "@/shared/ui/cn";
import { PencilIcon, SlidersIcon, TrashIcon } from "@/shared/ui/icons";
import { useScrollIntoView } from "@/shared/ui/use-scroll-into-view";

type ProfileRowProps = {
  profile: Profile;
  active: boolean;
  selected: boolean;
  index: number;
  onHover: () => void;
  onActivate: () => void;
  onRename: (to: string) => void;
  onEdit: (() => void) | null;
  onDelete: () => void;
};

const modelSummary = (count: number): string => `${count} ${count === 1 ? "model" : "models"}`;

const secondaryLine = (profile: Profile): string =>
  profile.type === "claude" ? (profile.email ?? "no email saved") : `${profile.provider} · ${modelSummary(profile.models.length)}`;

const SecondaryLine = ({ profile }: { profile: Profile }): ReactElement => (
  <div className="flex min-w-0 items-center gap-1.5">
    <p className="min-w-0 truncate text-[11px] text-faint">
      <bdi>{secondaryLine(profile)}</bdi>
    </p>
    {profile.type === "external" && <HarnessChips connections={profile.connections} />}
  </div>
);

const useInlineRename = (name: string, onRename: (to: string) => void) => {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);

  const start = () => {
    setDraft(name);
    setRenaming(true);
  };

  const cancel = () => setRenaming(false);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== name) onRename(trimmed);
    setRenaming(false);
  };

  return { renaming, draft, setDraft, start, cancel, commit };
};

type RowActionProps = {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: ReactNode;
};

const RowAction = ({ label, onClick, className, children }: RowActionProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn("rounded p-1 text-faint transition-colors hover:bg-surface-3 hover:text-foreground", className)}
  >
    {children}
  </button>
);

export const ProfileRow = ({
  profile,
  active,
  selected,
  index,
  onHover,
  onActivate,
  onRename,
  onEdit,
  onDelete,
}: ProfileRowProps): ReactElement => {
  const rowRef = useScrollIntoView<HTMLDivElement>(selected);
  const rename = useInlineRename(profile.name, onRename);

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") rename.commit();
    if (event.key === "Escape") rename.cancel();
  };

  const stopThen = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    action();
  };

  return (
    <div
      ref={rowRef}
      className={cn(
        "rise group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors",
        selected && "bg-surface-2",
      )}
      style={{ animationDelay: `${Math.min(index * 25, 200)}ms` }}
      onMouseEnter={onHover}
      onClick={() => {
        if (!rename.renaming) onActivate();
      }}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-brand" : "border border-faint")}
      />
      <div className="min-w-0 flex-1">
        {rename.renaming ? (
          <input
            autoFocus
            value={rename.draft}
            onChange={(event) => rename.setDraft(event.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={rename.cancel}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded border border-hairline-strong bg-surface px-1.5 py-0.5 font-mono text-[13px] text-foreground transition-colors focus:border-brand"
          />
        ) : (
          <>
            <p className={cn("truncate font-mono text-[13px]", active ? "text-brand-text" : "text-foreground")}>
              {profile.name}
            </p>
            <SecondaryLine profile={profile} />
          </>
        )}
      </div>
      {!rename.renaming && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <RowAction label="Rename" onClick={stopThen(rename.start)}>
            <PencilIcon size={12} />
          </RowAction>
          {onEdit && (
            <RowAction label="Edit name and key" onClick={stopThen(onEdit)}>
              <SlidersIcon size={12} />
            </RowAction>
          )}
          <RowAction label="Delete" onClick={stopThen(onDelete)} className="hover:text-[#f87171]">
            <TrashIcon size={12} />
          </RowAction>
        </div>
      )}
    </div>
  );
};
