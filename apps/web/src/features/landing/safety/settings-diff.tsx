"use client";

import { SegmentedControl, type SegmentedOption } from "@/features/landing/components/segmented-control";
import { DiffLineRow } from "@/features/landing/safety/diff-line";
import { SETTINGS_PATH, type DiffMode } from "@/features/landing/safety/settings-diff-model";
import { TrackedSwitch } from "@/features/landing/safety/tracked-switch";
import { TrackedWarning } from "@/features/landing/safety/tracked-warning";
import { useSettingsDiff } from "@/features/landing/safety/use-settings-diff";

const MODE_OPTIONS: readonly SegmentedOption<DiffMode>[] = [
  { value: "apply", label: "Connect provider" },
  { value: "strip", label: "Back to Claude" },
];

export const SettingsDiff = (): React.JSX.Element => {
  const { mode, setMode, tracked, toggleTracked, lines, summary, skipped } = useSettingsDiff();
  const changedIds = lines.filter((line) => line.change !== "context").map((line) => line.id);

  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-hairline-strong bg-background shadow-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <bdi className="font-mono text-xs text-muted">{SETTINGS_PATH}</bdi>
        <SegmentedControl label="Change to apply" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </figcaption>
      <div
        tabIndex={0}
        role="region"
        aria-label="settings.json diff"
        className="overflow-x-auto py-3 font-mono text-[0.8125rem] leading-relaxed focus-visible:focus-ring"
      >
        {lines.map((line) => (
          <DiffLineRow
            key={`${line.id}-${line.change}`}
            line={line}
            order={Math.max(changedIds.indexOf(line.id), 0)}
          />
        ))}
      </div>
      <p role="status" aria-live="polite" className="border-t border-hairline px-4 py-2.5 font-mono text-xs text-muted">
        {summary}
      </p>
      <div className="border-t border-hairline px-4 py-3">
        <TrackedSwitch checked={tracked} onToggle={toggleTracked} label="Config is tracked in git" />
      </div>
      {skipped ? <TrackedWarning /> : null}
    </figure>
  );
};
