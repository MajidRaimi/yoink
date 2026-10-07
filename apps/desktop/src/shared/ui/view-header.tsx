import type { ReactElement, ReactNode } from "react";
import { IconButton } from "./button";
import { ArrowLeftIcon } from "./icons";

type ViewHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  trailing?: ReactNode;
};

export const ViewHeader = ({ title, subtitle, onBack, trailing }: ViewHeaderProps): ReactElement => (
  <div className="flex shrink-0 items-center gap-1.5 px-3 pt-3">
    <IconButton label="Back" onClick={onBack}>
      <ArrowLeftIcon />
    </IconButton>
    <div className="min-w-0 flex-1">
      <h1 className="truncate font-sans text-[14px] font-medium text-foreground">{title}</h1>
      {subtitle !== undefined && <p className="truncate text-[11px] text-faint">{subtitle}</p>}
    </div>
    {trailing}
  </div>
);
