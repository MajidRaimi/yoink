import type { ReactElement } from "react";
import { Button } from "@/shared/ui/button";
import { ModelPicker } from "./model-picker";
import { submitOnModEnter } from "./submit-shortcut";
import { useProviderWizard } from "./use-provider-wizard";

const NO_MODELS: never[] = [];

export const WizardModelsStep = (): ReactElement => {
  const options = useProviderWizard((state) => state.probe?.models ?? NO_MODELS);
  const models = useProviderWizard((state) => state.models);
  const setModels = useProviderWizard((state) => state.setModels);
  const goTo = useProviderWizard((state) => state.goTo);
  const canContinue = models.length > 0;
  const next = (): void => goTo("harnesses");

  return (
    <div
      className="rise flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4"
      onKeyDown={submitOnModEnter(next, canContinue)}
    >
      <ModelPicker options={options} selected={models} onChange={setModels} autoFocus />
      <div className="flex shrink-0 items-center justify-between gap-2 pt-3">
        <span className="font-mono text-[11px] text-faint">Written to every harness</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => goTo("key")}>
            Back
          </Button>
          <Button disabled={!canContinue} onClick={next}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
