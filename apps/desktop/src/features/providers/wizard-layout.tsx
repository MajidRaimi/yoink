import type { FormEvent, ReactElement, ReactNode } from "react";
import { ErrorText } from "@/shared/ui/error-text";

type WizardStepLayoutProps = {
  children: ReactNode;
  status?: ReactNode;
  error: string | null;
  actions: ReactNode;
  onSubmit?: () => void;
};

export const WizardStepLayout = ({ children, status, error, actions, onSubmit }: WizardStepLayoutProps): ReactElement => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form className="rise flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4" onSubmit={handleSubmit}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">{children}</div>
      <ErrorText message={error} className="shrink-0 pt-2" />
      <div className="flex shrink-0 items-center justify-between gap-2 pt-3">
        <span className="min-w-0 truncate font-mono text-[11px] text-faint">{status}</span>
        <div className="flex shrink-0 gap-2">{actions}</div>
      </div>
    </form>
  );
};
