import type { ReactElement, ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export const Field = ({ label, hint, children }: FieldProps): ReactElement => (
  <label className="block">
    <span className="mb-1 flex items-baseline justify-between gap-2 text-[11px] text-muted">
      {label}
      {hint !== undefined && <span className="truncate text-faint">{hint}</span>}
    </span>
    {children}
  </label>
);
