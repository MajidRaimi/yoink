import type { ReactElement } from "react";
import type { ModelRef } from "@/shared/types";
import { CheckMark } from "@/shared/ui/check-mark";
import { cn } from "@/shared/ui/cn";
import { PlusIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { useScrollIntoView } from "@/shared/ui/use-scroll-into-view";
import { useModelPicker, type PickerRow } from "./use-model-picker";

type ModelPickerProps = {
  options: readonly ModelRef[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  allowCustom?: boolean;
  autoFocus?: boolean;
};

type PickerRowViewProps = {
  row: PickerRow;
  checked: boolean;
  highlighted: boolean;
  onHover: () => void;
  onPick: () => void;
};

const PickerRowView = ({ row, checked, highlighted, onHover, onPick }: PickerRowViewProps): ReactElement => {
  const ref = useScrollIntoView<HTMLButtonElement>(highlighted);
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors",
        highlighted && "bg-surface-2",
      )}
    >
      {row.kind === "model" ? (
        <>
          <CheckMark checked={checked} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-[12px] text-foreground">
              <bdi>{row.model.id}</bdi>
            </span>
            {row.model.name !== row.model.id && (
              <span className="block truncate text-[11px] text-faint">
                <bdi>{row.model.name}</bdi>
              </span>
            )}
          </span>
        </>
      ) : (
        <>
          <PlusIcon size={12} className="shrink-0 text-brand-text" />
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-muted">
            Add <bdi className="text-foreground">{row.id}</bdi>
          </span>
        </>
      )}
    </button>
  );
};

const rowKey = (row: PickerRow): string => (row.kind === "model" ? row.model.id : `custom:${row.id}`);

export const ModelPicker = ({
  options,
  selected,
  onChange,
  allowCustom = true,
  autoFocus = false,
}: ModelPickerProps): ReactElement => {
  const picker = useModelPicker({ options, selected, allowCustom, onChange });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Input
        autoFocus={autoFocus}
        value={picker.query}
        onChange={(event) => picker.setQuery(event.target.value)}
        onKeyDown={picker.handleKeyDown}
        placeholder={allowCustom ? "Search or type a model id" : "Search models"}
        className="py-1.5"
      />
      <div className="flex shrink-0 items-center justify-between font-mono text-[11px] text-faint">
        <span>
          <bdi>{selected.length}</bdi> selected
        </span>
        <span className="flex items-center gap-2">
          <button type="button" className="transition-colors hover:text-foreground" onClick={picker.selectVisible}>
            Select shown
          </button>
          <button type="button" className="transition-colors hover:text-foreground" onClick={picker.clear}>
            Clear
          </button>
        </span>
      </div>
      <div className="-mx-1.5 min-h-0 flex-1 overflow-y-auto">
        {picker.rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted">
            {options.length === 0 ? "No models reported. Type an id to add one." : "No matching models"}
          </p>
        ) : (
          picker.rows.map((row, index) => (
            <PickerRowView
              key={rowKey(row)}
              row={row}
              checked={row.kind === "model" && picker.isSelected(row.model.id)}
              highlighted={index === picker.highlighted}
              onHover={() => picker.setHighlighted(index)}
              onPick={() => picker.activate(row)}
            />
          ))
        )}
      </div>
    </div>
  );
};
