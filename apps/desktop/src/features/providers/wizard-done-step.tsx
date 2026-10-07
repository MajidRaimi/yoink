import type { ReactElement } from "react";
import { Button } from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons";
import { useViewStore } from "@/shared/view-store";
import { HarnessChips } from "@/shared/ui/harness-chips";
import { useProviderWizard } from "./use-provider-wizard";

export const WizardDoneStep = (): ReactElement | null => {
  const added = useProviderWizard((state) => state.added);
  const setView = useViewStore((state) => state.setView);
  const openHarnesses = useViewStore((state) => state.openHarnesses);
  if (added === null) return null;

  return (
    <div className="rise flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-8 items-center justify-center rounded-full bg-brand text-on-brand">
        <CheckIcon size={16} />
      </span>
      <div>
        <p className="font-mono text-[13px] text-foreground">
          <bdi>{added.name}</bdi> is ready
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          {added.harnesses.length === 0
            ? "Saved. Connect it to a harness whenever you like."
            : "Connected. New sessions in these harnesses will see it."}
        </p>
      </div>
      <HarnessChips connections={added.harnesses} />
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={() => openHarnesses(added.name)}>
          Harnesses
        </Button>
        <Button autoFocus onClick={() => setView("list")}>
          Done
        </Button>
      </div>
    </div>
  );
};
