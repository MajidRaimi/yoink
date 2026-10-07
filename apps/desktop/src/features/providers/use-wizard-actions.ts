import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { describeError } from "@/shared/errors";
import { ipc } from "@/shared/ipc";
import { queryKeys } from "@/shared/query";
import { useViewStore } from "@/shared/view-store";
import type { AddProviderInput, ProbeInput, ProbeResult } from "@/shared/types";
import { useProfilesQuery } from "@/shared/use-profiles-query";
import { useProviderWizard } from "./use-provider-wizard";
import { normalizeBaseUrl, toAddProviderInput, validateKeyStep } from "./wizard-input";

type StepAction = {
  run: () => void;
  pending: boolean;
  error: string | null;
};

type WizardState = ReturnType<typeof useProviderWizard.getState>;

const toProbeInput = (draft: WizardState): ProbeInput => ({
  preset: draft.preset?.id ?? null,
  baseUrl: draft.preset === null ? normalizeBaseUrl(draft.baseUrl) : null,
  token: draft.token.trim(),
});

const isStillProbing = (draft: WizardState, input: ProbeInput): boolean => {
  const current = toProbeInput(draft);
  return (
    draft.step === "key" &&
    current.preset === input.preset &&
    current.baseUrl === input.baseUrl &&
    current.token === input.token
  );
};

const isAlreadySavedError = (error: unknown): boolean => describeError(error).includes("already exists");

const useTakenNames = (): ReadonlySet<string> => {
  const { data } = useProfilesQuery();
  return useMemo(() => new Set((data?.profiles ?? []).map((profile) => profile.name)), [data]);
};

export const useProbeStep = (): StepAction => {
  const takenNames = useTakenNames();
  const acceptProbe = useProviderWizard((state) => state.acceptProbe);
  const [validationError, setValidationError] = useState<string | null>(null);
  const probe = useMutation({
    mutationFn: (input: ProbeInput) => ipc.probeProvider(input),
    gcTime: 0,
  });

  const run = (): void => {
    const draft = useProviderWizard.getState();
    const problem = validateKeyStep(draft, takenNames);
    setValidationError(problem);
    if (problem !== null) return;
    probe.mutate(toProbeInput(draft), {
      onSuccess: (result: ProbeResult, input: ProbeInput) => {
        if (isStillProbing(useProviderWizard.getState(), input)) acceptProbe(result);
      },
    });
  };

  return {
    run,
    pending: probe.isPending,
    error: validationError ?? (probe.error === null ? null : describeError(probe.error)),
  };
};

export const useSubmitProvider = (): StepAction => {
  const queryClient = useQueryClient();
  const finish = useProviderWizard((state) => state.finish);
  const openHarnesses = useViewStore((state) => state.openHarnesses);
  const submit = useMutation({
    mutationFn: (input: AddProviderInput) => ipc.addProvider(input),
    gcTime: 0,
    onSuccess: (_result, input) => finish({ name: input.name, harnesses: input.connect }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.allHarnesses }),
      ]),
  });

  const run = (): void => {
    const draft = useProviderWizard.getState();
    if (draft.models.length === 0) return;
    const retryingAfterFailedConnect = submit.isError && draft.harnesses.length > 0;
    submit.mutate(
      toAddProviderInput({
        ...draft,
        endpoints: draft.probe?.endpoints ?? draft.preset?.endpoints ?? [],
      }),
      {
        onError: (error, input) => {
          if (retryingAfterFailedConnect && isAlreadySavedError(error)) openHarnesses(input.name);
        },
      },
    );
  };

  return { run, pending: submit.isPending, error: submit.error === null ? null : describeError(submit.error) };
};
