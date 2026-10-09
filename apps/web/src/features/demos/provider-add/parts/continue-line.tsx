import { KeyReturnIcon } from "@phosphor-icons/react/ssr";
import { ActionLine } from "@/features/demos/provider-add/parts/action-line";
import { ENTER } from "@/features/demos/provider-add/parts/events";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";

export const ContinueLine = ({ onSend }: Pick<StepProps, "onSend">): React.JSX.Element => (
  <ActionLine
    icon={KeyReturnIcon}
    label="Continue"
    onActivate={onSend === undefined ? undefined : () => onSend([ENTER])}
  />
);
