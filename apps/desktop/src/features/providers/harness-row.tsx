import type { ReactElement } from "react";
import type { HarnessStatus, ModelRef } from "@/shared/types";
import { CheckMark } from "@/shared/ui/check-mark";
import { cn } from "@/shared/ui/cn";
import { ExperimentalTag } from "@/shared/ui/experimental-tag";
import { Select } from "@/shared/ui/input";
import { useScrollIntoView } from "@/shared/ui/use-scroll-into-view";
import { protocolRequirement } from "./harness-catalog";
import { isHarnessSelectable } from "./use-harness-status";

type HarnessRowProps = {
  status: HarnessStatus;
  models: readonly ModelRef[];
  active: boolean;
  pending: boolean;
  onHover: () => void;
  onToggle: () => void;
  onDefaultModel: (model: string) => void;
};

const stateLabel = (status: HarnessStatus, pending: boolean): string => {
  if (pending) return "applying";
  if (status.parseError !== null) return "unreadable";
  if (status.connected) return "connected";
  if (!status.installed) return "not installed";
  if (!status.compatible) return "incompatible";
  return "";
};

const detailLine = (status: HarnessStatus): string => {
  if (status.parseError !== null) return `config unreadable: ${status.parseError}`;
  if (!status.connected && status.installed && !status.compatible) return protocolRequirement(status.id);
  return status.configPath;
};

export const HarnessRow = ({
  status,
  models,
  active,
  pending,
  onHover,
  onToggle,
  onDefaultModel,
}: HarnessRowProps): ReactElement => {
  const ref = useScrollIntoView<HTMLDivElement>(active);
  const selectable = isHarnessSelectable(status);
  const label = stateLabel(status, pending);

  return (
    <div
      ref={ref}
      onMouseEnter={onHover}
      className={cn("rounded-lg px-2.5 py-1.5 transition-colors", active && "bg-surface-2")}
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={!selectable || pending}
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 text-left disabled:cursor-default"
      >
        <CheckMark checked={status.connected} disabled={!selectable} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className={cn("truncate font-mono text-[13px]", selectable ? "text-foreground" : "text-faint")}>
              {status.label}
            </span>
            {status.exclusive && <span className="shrink-0 text-[10px] text-faint">one at a time</span>}
            <ExperimentalTag experimental={status.experimental} />
          </span>
          <span className="block truncate text-[11px] text-faint">
            <bdi>{detailLine(status)}</bdi>
          </span>
        </span>
        {label.length > 0 && (
          <span
            className={cn(
              "shrink-0 font-mono text-[10px]",
              status.connected && !pending ? "text-brand-text" : "text-faint",
            )}
          >
            {label}
          </span>
        )}
      </button>
      {status.connected && !pending && status.notice !== null && (
        <p className="mt-1 pl-6 text-[11px] leading-snug text-muted">{status.notice}</p>
      )}
      {status.connected && status.setsDefaultModel && models.length > 0 && (
        <div className="mt-1.5 flex items-center gap-2 pl-6">
          <span className="shrink-0 text-[11px] text-faint">Default</span>
          <div className="min-w-0 flex-1">
            <Select
              value={status.defaultModel ?? ""}
              disabled={pending}
              onChange={(event) => onDefaultModel(event.target.value)}
              className="py-1 text-[11px]"
            >
              {status.defaultModel === null && (
                <option value="" disabled>
                  Harness default
                </option>
              )}
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
