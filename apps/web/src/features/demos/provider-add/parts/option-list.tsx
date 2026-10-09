import { cn } from "@/shared/lib/cn";
import { Line } from "@/features/demos/provider-add/parts/line";
import { optionId, rowWindow } from "@/features/demos/provider-add/selectors";

export type OptionKind = "radio" | "checkbox";

export type OptionRow = {
  key: string;
  label: string;
  tag?: string;
  hint?: string;
  checked?: boolean;
  disabled?: boolean;
};

export type OptionListProps = {
  idPrefix: string;
  label: string;
  kind: OptionKind;
  rows: readonly OptionRow[];
  cursor: number;
  windowSize: number;
  onPick?: (index: number) => void;
  empty?: string;
};

const markFor = (kind: OptionKind, row: OptionRow, active: boolean): string => {
  if (kind === "radio") return active ? "●" : "○";
  return row.checked === true ? "◼" : "◻";
};

const markTone = (kind: OptionKind, row: OptionRow, active: boolean): string => {
  if (row.disabled === true) return "text-faint";
  if (active || (kind === "checkbox" && row.checked === true)) return "text-brand-text";
  return "text-muted";
};

const MoreLine = ({ count }: { count: number }): React.JSX.Element | null =>
  count === 0 ? null : (
    <Line>
      <span className="text-faint">...</span>
    </Line>
  );

export const OptionList = ({
  idPrefix,
  label,
  kind,
  rows,
  cursor,
  windowSize,
  onPick,
  empty,
}: OptionListProps): React.JSX.Element => {
  const view = rowWindow(rows.length, cursor, windowSize);
  return (
    <div
      role="listbox"
      aria-label={label}
      aria-multiselectable={kind === "checkbox" ? true : undefined}
    >
      <MoreLine count={view.above} />
      {rows.length === 0 && empty !== undefined ? (
        <Line>
          <span className="text-faint">{empty}</span>
        </Line>
      ) : null}
      {rows.slice(view.start, view.end).map((row, offset) => {
        const index = view.start + offset;
        const active = index === cursor;
        const disabled = row.disabled === true;
        return (
          <div
            key={row.key}
            id={optionId(idPrefix, row.key)}
            role="option"
            aria-selected={kind === "checkbox" ? row.checked === true : active}
            aria-disabled={disabled ? true : undefined}
            onClick={onPick === undefined || disabled ? undefined : () => onPick(index)}
            className={cn(onPick !== undefined && !disabled && "cursor-pointer")}
          >
            <Line>
              <span aria-hidden="true" className={cn("shrink-0", markTone(kind, row, active))}>
                {markFor(kind, row, active)}
              </span>
              <span
                className={cn(
                  row.hint === undefined ? "min-w-0 truncate" : "shrink-0",
                  disabled ? "text-faint line-through" : active ? "text-foreground" : "text-muted",
                )}
              >
                {row.label}
              </span>
              {row.tag === undefined ? null : <span className="shrink-0 text-faint">{row.tag}</span>}
              {row.hint === undefined ? null : (
                <span title={row.hint} className="min-w-0 truncate text-faint">
                  {row.hint}
                </span>
              )}
            </Line>
          </div>
        );
      })}
      <MoreLine count={view.below} />
    </div>
  );
};
