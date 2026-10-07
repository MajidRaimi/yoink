import type { ReactElement } from "react";
import type { HarnessId } from "@/shared/types";
import { harnessLabel } from "@/shared/harness-labels";

const VISIBLE_CHIPS = 3;

const Chip = ({ label }: { label: string }): ReactElement => (
  <span className="shrink-0 rounded border border-hairline bg-surface px-1 font-mono text-[10px] leading-4 text-muted">
    {label}
  </span>
);

export const HarnessChips = ({ connections }: { connections: readonly HarnessId[] }): ReactElement | null => {
  if (connections.length === 0) return null;
  const visible = connections.slice(0, VISIBLE_CHIPS);
  const hidden = connections.length - visible.length;
  return (
    <span className="flex shrink-0 items-center gap-1" aria-label="Connected harnesses">
      {visible.map((id) => (
        <Chip key={id} label={harnessLabel(id)} />
      ))}
      {hidden > 0 && <Chip label={`+${hidden}`} />}
    </span>
  );
};
