import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { ipc } from "@/shared/ipc";
import { queryKeys } from "@/shared/query";
import type { HarnessId } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons";
import { useViewStore } from "@/shared/view-store";
import { HarnessChips } from "@/shared/ui/harness-chips";
import { connectNotices, type ConnectNotice } from "./connect-notices";
import { useProviderWizard } from "./use-provider-wizard";

const useConnectNotices = (name: string, harnesses: readonly HarnessId[]): ConnectNotice[] => {
  const { data } = useQuery({
    queryKey: queryKeys.harnesses(name),
    queryFn: () => ipc.providerHarnesses(name),
    enabled: name !== "" && harnesses.length > 0,
  });
  return data === undefined ? [] : connectNotices(data, harnesses);
};

const ConnectNoticeList = ({ notices }: { notices: readonly ConnectNotice[] }): ReactElement | null => {
  if (notices.length === 0) return null;
  return (
    <ul className="w-full max-w-sm space-y-1.5 text-start" aria-label="Next steps">
      {notices.map((entry) => (
        <li key={entry.id} className="rounded border border-hairline bg-surface px-2 py-1.5 text-[11px] leading-snug">
          <span className="font-mono text-foreground">{entry.label}</span>
          <p className="mt-0.5 text-muted">{entry.notice}</p>
        </li>
      ))}
    </ul>
  );
};

const summaryLine = (harnessCount: number, noticeCount: number): string => {
  if (harnessCount === 0) return "Saved. Connect it to a harness whenever you like.";
  if (noticeCount === 0) return "Connected. New sessions in these harnesses will see it.";
  return "Connected. A few harnesses need one more step:";
};

export const WizardDoneStep = (): ReactElement | null => {
  const added = useProviderWizard((state) => state.added);
  const setView = useViewStore((state) => state.setView);
  const openHarnesses = useViewStore((state) => state.openHarnesses);
  const notices = useConnectNotices(added?.name ?? "", added?.harnesses ?? []);
  if (added === null) return null;

  return (
    <div className="rise flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="m-auto flex w-full flex-col items-center gap-3 px-6 py-4 text-center">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
        <CheckIcon size={16} />
      </span>
      <div>
        <p className="font-mono text-[13px] text-foreground">
          <bdi>{added.name}</bdi> is ready
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          {summaryLine(added.harnesses.length, notices.length)}
        </p>
      </div>
      <HarnessChips connections={added.harnesses} />
      <ConnectNoticeList notices={notices} />
      <div className="mt-2 flex shrink-0 gap-2">
        <Button variant="secondary" onClick={() => openHarnesses(added.name)}>
          Harnesses
        </Button>
        <Button autoFocus onClick={() => setView("list")}>
          Done
        </Button>
      </div>
      </div>
    </div>
  );
};
