import type { ReactElement } from "react";
import type { Endpoint, HarnessId } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { CheckMark } from "@/shared/ui/check-mark";
import { cn } from "@/shared/ui/cn";
import { ExperimentalTag } from "@/shared/ui/experimental-tag";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/input";
import { useAutoFocus } from "@/shared/ui/use-auto-focus";
import { useListNavigation } from "@/shared/ui/use-list-navigation";
import { HARNESSES, protocolRequirement, supportsHarness, type HarnessInfo } from "./harness-catalog";
import { submitOnModEnter } from "./submit-shortcut";
import { useProviderWizard } from "./use-provider-wizard";
import { useSubmitProvider } from "./use-wizard-actions";
import { WizardStepLayout } from "./wizard-layout";

const NO_ENDPOINTS: Endpoint[] = [];

type WizardHarnessRowProps = {
  harness: HarnessInfo;
  compatible: boolean;
  checked: boolean;
  active: boolean;
  onHover: () => void;
  onToggle: () => void;
};

const WizardHarnessRow = ({ harness, compatible, checked, active, onHover, onToggle }: WizardHarnessRowProps): ReactElement => (
  <button
    type="button"
    tabIndex={-1}
    disabled={!compatible}
    onMouseEnter={onHover}
    onClick={onToggle}
    className={cn(
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors disabled:cursor-default",
      active && "bg-surface-2",
    )}
  >
    <CheckMark checked={checked} disabled={!compatible} />
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline gap-1.5">
        <span className={cn("truncate font-mono text-[13px]", compatible ? "text-foreground" : "text-faint")}>
          {harness.label}
        </span>
        <ExperimentalTag experimental={harness.experimental} />
      </span>
      <span className="block truncate text-[11px] text-faint">
        {compatible ? (harness.exclusive ? "One provider at a time" : "Adds alongside other providers") : protocolRequirement(harness.id)}
      </span>
    </span>
  </button>
);

export const WizardHarnessesStep = (): ReactElement => {
  const endpoints = useProviderWizard((state) => state.probe?.endpoints ?? state.preset?.endpoints ?? NO_ENDPOINTS);
  const harnesses = useProviderWizard((state) => state.harnesses);
  const models = useProviderWizard((state) => state.models);
  const defaultModel = useProviderWizard((state) => state.defaultModel);
  const toggleHarness = useProviderWizard((state) => state.toggleHarness);
  const setDefaultModel = useProviderWizard((state) => state.setDefaultModel);
  const goTo = useProviderWizard((state) => state.goTo);
  const submit = useSubmitProvider();

  const isCompatible = (harness: HarnessInfo): boolean => supportsHarness(endpoints, harness);
  const toggleIfCompatible = (harness: HarnessInfo | undefined): void => {
    if (harness && isCompatible(harness)) toggleHarness(harness.id);
  };
  const focusRef = useAutoFocus<HTMLDivElement>();
  const navigation = useListNavigation({
    count: HARNESSES.length,
    onActivate: (index) => toggleIfCompatible(HARNESSES[index]),
  });
  const isChecked = (id: HarnessId): boolean => harnesses.includes(id);
  const offersDefaultModel = HARNESSES.some((harness) => harness.setsDefaultModel && isChecked(harness.id));

  return (
    <WizardStepLayout
      error={submit.error}
      status={submit.pending ? "Writing configs" : `${harnesses.length} selected`}
      onSubmit={submit.run}
      actions={
        <>
          <Button variant="secondary" onClick={() => goTo("models")}>
            Back
          </Button>
          <Button type="submit" disabled={submit.pending}>
            {harnesses.length === 0 ? "Save" : "Save & connect"}
          </Button>
        </>
      }
    >
      <div
        ref={focusRef}
        tabIndex={0}
        role="listbox"
        aria-label="Harnesses"
        className="-mx-1.5"
        onKeyDown={(event) => {
          submitOnModEnter(submit.run, !submit.pending)(event);
          if (!event.defaultPrevented) navigation.handleKeyDown(event);
        }}
      >
        {HARNESSES.map((harness, index) => (
          <WizardHarnessRow
            key={harness.id}
            harness={harness}
            compatible={isCompatible(harness)}
            checked={isChecked(harness.id)}
            active={index === navigation.active}
            onHover={() => navigation.setActive(index)}
            onToggle={() => toggleIfCompatible(harness)}
          />
        ))}
      </div>
      {offersDefaultModel && (
        <Field label="Default model" hint="for the harnesses above">
          <Select
            value={defaultModel ?? ""}
            onChange={(event) => setDefaultModel(event.target.value.length === 0 ? null : event.target.value)}
            className="py-1.5 text-[12px]"
          >
            <option value="">Keep each harness default</option>
            {models.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </WizardStepLayout>
  );
};
