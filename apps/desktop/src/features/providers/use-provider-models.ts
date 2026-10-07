import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { describeError } from "@/shared/errors";
import { ipc } from "@/shared/ipc";
import { providerMutations, queryKeys } from "@/shared/query";
import type { ExternalProfile } from "@/shared/types";

type ProviderModelsApi = {
  draft: string[];
  setDraft: (ids: string[]) => void;
  dirty: boolean;
  save: () => void;
  reset: () => void;
  saving: boolean;
  error: string | null;
};

const sameSelection = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((id) => right.includes(id));

export const useProviderModels = (profile: ExternalProfile): ProviderModelsApi => {
  const queryClient = useQueryClient();
  const saved = profile.models.map((model) => model.id);
  const [draft, setDraft] = useState<string[]>(saved);

  const mutation = useMutation({
    ...providerMutations(profile.name),
    mutationFn: (models: string[]) => ipc.setProviderModels(profile.name, models),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.harnesses(profile.name) }),
      ]),
  });

  const save = (): void => {
    if (draft.length === 0) return;
    mutation.mutate(draft);
  };

  return {
    draft,
    setDraft,
    dirty: !sameSelection(draft, saved),
    save,
    reset: () => setDraft(saved),
    saving: mutation.isPending,
    error: mutation.error === null ? null : describeError(mutation.error),
  };
};
