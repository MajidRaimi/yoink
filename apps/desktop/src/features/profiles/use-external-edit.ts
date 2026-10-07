import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { describeError } from "@/shared/errors";
import { ipc } from "@/shared/ipc";
import { queryKeys } from "@/shared/query";
import type { ExternalInput, ExternalProfile } from "@/shared/types";

export type ExternalEditDraft = {
  name: string;
  provider: string;
  token: string;
};

type ExternalEditApi = {
  draft: ExternalEditDraft;
  setField: (field: keyof ExternalEditDraft, value: string) => void;
  submit: () => void;
  saving: boolean;
  error: string | null;
};

const validate = (draft: ExternalEditDraft): string | null => {
  if (draft.name.trim().length === 0) return "A profile name is required";
  if (draft.provider.trim().length === 0) return "A display name is required";
  return null;
};

const toInput = (profile: ExternalProfile, draft: ExternalEditDraft): ExternalInput => {
  const token = draft.token.trim();
  return {
    name: draft.name.trim(),
    provider: draft.provider.trim(),
    baseUrl: profile.baseUrl,
    model: profile.model,
    ...(token.length > 0 ? { token } : {}),
  };
};

export const useExternalEdit = (profile: ExternalProfile, onSaved: (name: string) => void): ExternalEditApi => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ExternalEditDraft>({ name: profile.name, provider: profile.provider, token: "" });
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: ExternalInput) => ipc.editExternal(profile.name, input),
    gcTime: 0,
    onSuccess: (_result, input) => onSaved(input.name),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.allHarnesses }),
      ]),
  });

  const setField = (field: keyof ExternalEditDraft, value: string): void =>
    setDraft((previous) => ({ ...previous, [field]: value }));

  const submit = (): void => {
    const problem = validate(draft);
    setValidationError(problem);
    if (problem === null) mutation.mutate(toInput(profile, draft));
  };

  return {
    draft,
    setField,
    submit,
    saving: mutation.isPending,
    error: validationError ?? (mutation.error === null ? null : describeError(mutation.error)),
  };
};
