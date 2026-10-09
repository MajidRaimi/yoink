"use client";

import { cx } from "@/shared/lib/cx";
import { CopyCommand } from "@/shared/ui/copy-command";
import { CopyLineText } from "@/features/download/components/copy-line-text";
import { useInstallTabs } from "@/features/download/hooks/use-install-tabs";
import { INSTALL_OPTIONS, INSTALL_TAB_IDS, VERIFY_COMMAND } from "@/features/download/lib/install-options";

export type InstallTabsProps = {
  className?: string;
};

export const InstallTabs = ({ className }: InstallTabsProps): React.JSX.Element => {
  const { active, tabProps, panelProps } = useInstallTabs();

  return (
    <div className={cx("min-w-0 rounded-lg border border-hairline bg-surface-2", className)}>
      <div
        role="tablist"
        aria-label="Install method"
        className="flex gap-1 overflow-x-auto px-2 pt-2 shadow-[inset_0_-1px_0_var(--hairline)]"
      >
        {INSTALL_TAB_IDS.map((id) => (
          <button
            key={id}
            {...tabProps(id)}
            className={cx(
              "shrink-0 rounded-t-sm border-b-2 px-3.5 py-2 text-sm font-medium transition-colors dur-1 focus-visible:focus-ring focus-visible:-outline-offset-2!",
              id === active ? "border-brand-text text-foreground" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {INSTALL_OPTIONS[id].label}
          </button>
        ))}
      </div>
      <div className="grid">
        {INSTALL_TAB_IDS.map((id) => {
          const option = INSTALL_OPTIONS[id];
          return (
            <div
              key={id}
              {...panelProps(id)}
              className={cx(
                "flex flex-col gap-4 p-4 [grid-area:1/1] focus-visible:focus-ring sm:p-5",
                id !== active && "invisible",
              )}
            >
              <CopyCommand command={option.command} prompt={option.prompt} />
              <p className="text-sm text-muted">
                <CopyLineText line={option.detail} />
              </p>
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Requirements: </span>
                <CopyLineText line={option.requirement} />
              </p>
              <div className="flex flex-col gap-2 border-t border-hairline pt-4">
                <p className="text-sm text-muted">Then check that it is on your PATH:</p>
                <CopyCommand command={VERIFY_COMMAND} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
