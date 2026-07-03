import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionLabel = ({ children, className }: SectionLabelProps) => (
  <div className={cn("flex items-center gap-3", className)}>
    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">{children}</span>
    <span className="h-px flex-1 bg-gradient-to-r from-hairline-strong to-transparent" />
  </div>
);
