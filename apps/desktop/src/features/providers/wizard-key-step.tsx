import type { ReactElement } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useProviderWizard } from "./use-provider-wizard";
import { useProbeStep } from "./use-wizard-actions";
import { WizardStepLayout } from "./wizard-layout";

export const WizardKeyStep = (): ReactElement => {
  const preset = useProviderWizard((state) => state.preset);
  const name = useProviderWizard((state) => state.name);
  const displayName = useProviderWizard((state) => state.displayName);
  const baseUrl = useProviderWizard((state) => state.baseUrl);
  const token = useProviderWizard((state) => state.token);
  const setField = useProviderWizard((state) => state.setField);
  const goTo = useProviderWizard((state) => state.goTo);
  const probe = useProbeStep();
  const custom = preset === null;

  return (
    <WizardStepLayout
      error={probe.error}
      status={probe.pending ? "Checking the key" : null}
      onSubmit={probe.run}
      actions={
        <>
          <Button variant="secondary" disabled={probe.pending} onClick={() => goTo("source")}>
            Back
          </Button>
          <Button type="submit" disabled={probe.pending}>
            Continue
          </Button>
        </>
      }
    >
      <Field label="Provider id" hint="used in every harness config">
        <Input
          value={name}
          onChange={(event) => setField("name", event.target.value)}
          placeholder="openrouter"
          spellCheck={false}
        />
      </Field>
      {custom && (
        <>
          <Field label="Display name">
            <Input
              value={displayName}
              onChange={(event) => setField("displayName", event.target.value)}
              placeholder="My gateway"
            />
          </Field>
          <Field label="Base URL">
            <Input
              value={baseUrl}
              autoFocus
              onChange={(event) => setField("baseUrl", event.target.value)}
              placeholder="https://api.example.com/v1"
              spellCheck={false}
            />
          </Field>
        </>
      )}
      <Field label="API key" hint={custom ? "probed for supported protocols" : preset.label}>
        <Input
          autoFocus={!custom}
          type="password"
          value={token}
          onChange={(event) => setField("token", event.target.value)}
          placeholder="sk-…"
        />
      </Field>
    </WizardStepLayout>
  );
};
