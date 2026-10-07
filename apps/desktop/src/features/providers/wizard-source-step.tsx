import type { ReactElement } from "react";
import { describeError } from "@/shared/errors";
import type { ProviderPreset } from "@/shared/types";
import { cn } from "@/shared/ui/cn";
import { ErrorText } from "@/shared/ui/error-text";
import { useAutoFocus } from "@/shared/ui/use-auto-focus";
import { useListNavigation } from "@/shared/ui/use-list-navigation";
import { PROTOCOL_SHORT_LABELS } from "./harness-catalog";
import { usePresets } from "./use-presets";
import { useProviderWizard } from "./use-provider-wizard";

const COLUMNS = 2;

type SourceTileProps = {
  title: string;
  detail: string;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
};

const SourceTile = ({ title, detail, active, onHover, onPick }: SourceTileProps): ReactElement => (
  <button
    type="button"
    tabIndex={-1}
    onMouseEnter={onHover}
    onClick={onPick}
    className={cn(
      "rounded-lg border bg-surface px-2.5 py-2 text-left transition-colors",
      active ? "border-brand bg-surface-2" : "border-hairline hover:border-hairline-strong",
    )}
  >
    <span className="block truncate font-mono text-[12px] text-foreground">{title}</span>
    <span className="mt-0.5 block truncate text-[11px] text-faint">{detail}</span>
  </button>
);

const presetDetail = (preset: ProviderPreset): string =>
  [...new Set(preset.endpoints.map((endpoint) => PROTOCOL_SHORT_LABELS[endpoint.protocol]))].join(" · ");

export const WizardSourceStep = (): ReactElement => {
  const presetsQuery = usePresets();
  const choosePreset = useProviderWizard((state) => state.choosePreset);
  const presets = presetsQuery.data ?? [];
  const choices: Array<ProviderPreset | null> = [...presets, null];
  const focusRef = useAutoFocus<HTMLDivElement>();
  const navigation = useListNavigation({
    count: choices.length,
    columns: COLUMNS,
    onActivate: (index) => choosePreset(choices[index] ?? null),
  });

  return (
    <div className="rise flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4">
      <p className="shrink-0 pb-2 text-[11px] text-muted">Pick a provider, or connect any compatible API.</p>
      <div
        ref={focusRef}
        tabIndex={0}
        role="listbox"
        aria-label="Provider presets"
        onKeyDown={navigation.handleKeyDown}
        className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-1.5 overflow-y-auto"
      >
        {choices.map((preset, index) => (
          <SourceTile
            key={preset?.id ?? "custom"}
            title={preset?.label ?? "Custom"}
            detail={preset === null ? "Any OpenAI or Anthropic API" : presetDetail(preset)}
            active={index === navigation.active}
            onHover={() => navigation.setActive(index)}
            onPick={() => choosePreset(preset)}
          />
        ))}
      </div>
      {presetsQuery.isPending && <p className="shrink-0 pt-2 font-mono text-[11px] text-faint">Loading presets</p>}
      <ErrorText
        message={presetsQuery.error === null ? null : describeError(presetsQuery.error)}
        className="shrink-0 pt-2"
      />
    </div>
  );
};
