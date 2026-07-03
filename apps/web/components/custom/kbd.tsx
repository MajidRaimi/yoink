export const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-hairline-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8em] text-foreground">
    {children}
  </kbd>
);
