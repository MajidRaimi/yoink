import { cn } from "@/lib/utils";

type TerminalWindowProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export const TerminalWindow = ({ title = "yoink", children, className }: TerminalWindowProps) => (
  <div
    className={cn(
      "overflow-hidden rounded-xl border border-hairline-strong bg-white shadow-2xl shadow-black/10 dark:bg-[#0d0c0b] dark:shadow-black/50",
      className,
    )}
  >
    <div className="flex items-center gap-2 border-b border-hairline bg-foreground/[0.03] px-4 py-2.5">
      <span className="size-3 rounded-full bg-foreground/15" />
      <span className="size-3 rounded-full bg-foreground/15" />
      <span className="size-3 rounded-full bg-foreground/15" />
      <span className="ml-2 font-mono text-xs text-faint">{title}</span>
    </div>
    <div className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-foreground/90">
      {children}
    </div>
  </div>
);
