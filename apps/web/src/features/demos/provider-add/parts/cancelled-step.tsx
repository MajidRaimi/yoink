import { Line } from "@/features/demos/provider-add/parts/line";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { CANCELLED_MESSAGE } from "@/features/demos/provider-add/machine";

export const CancelledStep = ({ state }: StepProps): React.JSX.Element => (
  <>
    <Line glyph="end">
      <span className="truncate text-danger">{state.message ?? CANCELLED_MESSAGE}</span>
    </Line>
    <Line>
      <span className="truncate text-faint">Press Enter to start over.</span>
    </Line>
  </>
);
