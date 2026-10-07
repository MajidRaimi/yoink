import type { ReactElement } from "react";
import type { ExternalProfile } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { ErrorText } from "@/shared/ui/error-text";
import { ModelPicker } from "./model-picker";
import { submitOnModEnter } from "./submit-shortcut";
import { useProviderModels } from "./use-provider-models";

export const ProviderModelsPanel = ({ profile }: { profile: ExternalProfile }): ReactElement => {
  const models = useProviderModels(profile);
  const canSave = models.dirty && models.draft.length > 0 && !models.saving;

  return (
    <div className="flex min-h-0 flex-1 flex-col" onKeyDown={submitOnModEnter(models.save, canSave)}>
      <ModelPicker options={profile.models} selected={models.draft} onChange={models.setDraft} autoFocus />
      <ErrorText message={models.error} className="shrink-0 pt-2" />
      <div className="flex shrink-0 items-center justify-between gap-2 pt-3">
        <span className="font-mono text-[11px] text-faint">
          {models.saving ? "Syncing harnesses" : "Saved to every connected harness"}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!models.dirty || models.saving} onClick={models.reset}>
            Reset
          </Button>
          <Button disabled={!canSave} onClick={models.save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
