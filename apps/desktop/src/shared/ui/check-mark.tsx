import type { ReactElement } from "react";
import { cn } from "./cn";
import { CheckIcon } from "./icons";

type CheckMarkProps = {
  checked: boolean;
  disabled?: boolean;
};

export const CheckMark = ({ checked, disabled = false }: CheckMarkProps): ReactElement => (
  <span
    aria-hidden="true"
    className={cn(
      "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
      checked ? "border-brand bg-brand text-on-brand" : "border-hairline-strong bg-surface",
      disabled && "opacity-40",
    )}
  >
    {checked && <CheckIcon size={10} />}
  </span>
);
