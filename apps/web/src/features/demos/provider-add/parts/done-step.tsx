import { CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { Icon } from "@/shared/ui/icon";
import { ActionLine } from "@/features/demos/provider-add/parts/action-line";
import { Line } from "@/features/demos/provider-add/parts/line";
import { ENTER } from "@/features/demos/provider-add/parts/events";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { HARNESS_CONFIG_PATHS } from "@/features/demos/data/fixtures";
import type { HarnessId } from "@/features/demos/data/harnesses.gen";
import { harnessLabel } from "@/features/demos/provider-add/harness-rows";
import type { Outcome } from "@/features/demos/provider-add/machine";

const VISIBLE_RESULTS = 8;
const TICK_STAGGER_MS = 90;

const VERBS: Readonly<Record<Outcome, string>> = {
  connected: "Connected",
  resynced: "Re-synced",
  unchanged: "Connected",
};

const OUTROS: Readonly<Record<Outcome, string>> = {
  connected: "Done. Restart running harnesses to pick up the change.",
  resynced: "Done.",
  unchanged: "No changes.",
};

type ResultLineProps = {
  id: HarnessId;
  verb: string;
  order: number;
};

const ResultLine = ({ id, verb, order }: ResultLineProps): React.JSX.Element => (
  <Line>
    <span
      style={{ transitionDelay: `${order * TICK_STAGGER_MS}ms` }}
      className="inline-flex shrink-0 text-success transition-[opacity,transform] dur-2 motion-reduce:transition-none starting:scale-50 starting:opacity-0"
    >
      <Icon icon={CheckIcon} size={12} weight="bold" />
    </span>
    <span className="shrink-0 text-foreground">{`${verb} ${harnessLabel(id)}`}</span>
    <span title={HARNESS_CONFIG_PATHS[id]} className="min-w-0 truncate text-faint">
      {HARNESS_CONFIG_PATHS[id]}
    </span>
  </Line>
);

export const DoneStep = ({ state, onSend }: StepProps): React.JSX.Element => {
  const verb = VERBS[state.outcome];
  const shown = state.outcome === "unchanged" ? [] : state.connected.slice(0, VISIBLE_RESULTS);
  const hidden = state.outcome === "unchanged" ? 0 : state.connected.length - shown.length;
  return (
    <>
      <div key={state.syncRound}>
        {shown.map((id, order) => (
          <ResultLine key={id} id={id} verb={verb} order={order} />
        ))}
      </div>
      {hidden === 0 ? null : (
        <Line>
          <span className="text-faint">{`and ${hidden} more`}</span>
        </Line>
      )}
      <Line glyph="end">
        <span className="truncate text-foreground">{OUTROS[state.outcome]}</span>
      </Line>
      <ActionLine
        icon={PencilSimpleIcon}
        label="Edit models"
        onActivate={onSend === undefined ? undefined : () => onSend([ENTER])}
      />
    </>
  );
};
