import { useEffect, type ReactElement } from "react";
import { useEscapeKey } from "@/shared/ui/dialog";
import { ViewHeader } from "@/shared/ui/view-header";
import { useViewStore } from "@/shared/view-store";
import { previousStep, useProviderWizard, type WizardStep } from "./use-provider-wizard";
import { WizardDoneStep } from "./wizard-done-step";
import { WizardHarnessesStep } from "./wizard-harnesses-step";
import { WizardKeyStep } from "./wizard-key-step";
import { WizardModelsStep } from "./wizard-models-step";
import { WizardSourceStep } from "./wizard-source-step";

const STEP_TITLES: Record<WizardStep, string> = {
  source: "Provider",
  key: "API key",
  models: "Models",
  harnesses: "Harnesses",
  done: "Done",
};

const NUMBERED_STEPS: readonly WizardStep[] = ["source", "key", "models", "harnesses"];

const stepSubtitle = (step: WizardStep): string => {
  const position = NUMBERED_STEPS.indexOf(step);
  if (position === -1) return STEP_TITLES[step];
  return `Step ${position + 1} of ${NUMBERED_STEPS.length} · ${STEP_TITLES[step]}`;
};

const useWizardLifecycle = (): void => {
  const reset = useProviderWizard((state) => state.reset);
  useEffect(() => {
    reset();
    return reset;
  }, [reset]);
};

const useWizardBack = (): (() => void) => {
  const setView = useViewStore((state) => state.setView);
  const goTo = useProviderWizard((state) => state.goTo);
  return () => {
    const previous = previousStep(useProviderWizard.getState().step);
    if (previous === null) setView("list");
    else goTo(previous);
  };
};

const StepBody = ({ step }: { step: WizardStep }): ReactElement | null => {
  switch (step) {
    case "source":
      return <WizardSourceStep />;
    case "key":
      return <WizardKeyStep />;
    case "models":
      return <WizardModelsStep />;
    case "harnesses":
      return <WizardHarnessesStep />;
    case "done":
      return <WizardDoneStep />;
  }
};

export const ProviderWizard = (): ReactElement => {
  const step = useProviderWizard((state) => state.step);
  const preset = useProviderWizard((state) => state.preset);
  const back = useWizardBack();
  useWizardLifecycle();
  useEscapeKey(back);

  const title = step === "source" || step === "done" ? "Add provider" : `Add ${preset?.label ?? "custom provider"}`;

  return (
    <div className="rise flex min-h-0 flex-1 flex-col">
      <ViewHeader title={title} subtitle={stepSubtitle(step)} onBack={back} />
      <StepBody key={step} step={step} />
    </div>
  );
};
