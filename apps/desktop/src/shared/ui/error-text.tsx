import type { ReactElement } from "react";
import { cn } from "./cn";

export const ErrorText = ({ message, className }: { message: string | null; className?: string }): ReactElement | null =>
  message === null ? null : <p className={cn("font-mono text-[11px] text-[#f87171]", className)}>{message}</p>;
