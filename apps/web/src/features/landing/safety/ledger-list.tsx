import { LEDGER } from "@/features/landing/safety/ledger";

export const LedgerList = (): React.JSX.Element => (
  <div className="flex min-w-0 flex-col">
    <h3 className="text-sm font-medium text-foreground">Files yoink touches</h3>
    <ul className="mt-3 flex flex-col border-t border-hairline">
      {LEDGER.map((entry) => (
        <li key={entry.path} className="flex flex-col gap-1 border-b border-hairline py-3">
          <div className="flex items-baseline justify-between gap-4">
            <bdi className="min-w-0 font-mono text-sm tracking-mono break-all text-foreground">{entry.path}</bdi>
            <bdi className="shrink-0 font-mono text-xs text-muted">{entry.mode}</bdi>
          </div>
          <p className="text-sm text-muted">{entry.what}</p>
        </li>
      ))}
    </ul>
  </div>
);
