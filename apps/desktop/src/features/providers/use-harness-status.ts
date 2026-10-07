import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { describeError } from "@/shared/errors";
import { ipc } from "@/shared/ipc";
import { providerMutations, queryKeys } from "@/shared/query";
import type { HarnessId, HarnessStatus } from "@/shared/types";

type ToggleVariables = { id: HarnessId; connect: boolean };

type DefaultVariables = { id: HarnessId; model: string };

type HarnessStatusApi = {
  statuses: HarnessStatus[];
  loading: boolean;
  isPending: (id: HarnessId) => boolean;
  error: string | null;
  toggle: (status: HarnessStatus) => void;
  setDefaultModel: (id: HarnessId, model: string) => void;
};

const withConnected = (statuses: HarnessStatus[] | undefined, id: HarnessId, connected: boolean): HarnessStatus[] =>
  (statuses ?? []).map((status) => (status.id === id ? { ...status, connected } : status));

const harnessIdOf = (variables: unknown): HarnessId | null =>
  typeof variables === "object" && variables !== null && "id" in variables
    ? (variables as { id: HarnessId }).id
    : null;

export const isHarnessSelectable = (status: HarnessStatus): boolean =>
  status.connected || (status.installed && status.compatible);

export const useHarnessStatus = (name: string): HarnessStatusApi => {
  const queryClient = useQueryClient();
  const key = queryKeys.harnesses(name);
  const mutations = providerMutations(name);
  const statusesQuery = useQuery({ queryKey: key, queryFn: () => ipc.providerHarnesses(name) });

  const pendingIds = useMutationState({
    filters: { mutationKey: mutations.mutationKey, status: "pending" },
    select: (mutation) => harnessIdOf(mutation.state.variables),
  });

  const invalidateWhenIdle = async (): Promise<void> => {
    if (queryClient.isMutating({ mutationKey: mutations.mutationKey }) > 1) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.allHarnesses }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
    ]);
  };

  const toggleMutation = useMutation({
    ...mutations,
    mutationFn: ({ id, connect }: ToggleVariables) =>
      connect ? ipc.connectProvider(name, [id], null) : ipc.disconnectProvider(name, [id]),
    onMutate: async ({ id, connect }: ToggleVariables) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<HarnessStatus[]>(key, (previous) => withConnected(previous, id, connect));
    },
    onSettled: invalidateWhenIdle,
  });

  const defaultMutation = useMutation({
    ...mutations,
    mutationFn: ({ id, model }: DefaultVariables) => ipc.connectProvider(name, [id], model),
    onSettled: invalidateWhenIdle,
  });

  const isPending = (id: HarnessId): boolean => pendingIds.includes(id);

  const toggle = (status: HarnessStatus): void => {
    if (!isHarnessSelectable(status) || isPending(status.id)) return;
    toggleMutation.mutate({ id: status.id, connect: !status.connected });
  };

  const setDefaultModel = (id: HarnessId, model: string): void => defaultMutation.mutate({ id, model });

  const failure = toggleMutation.error ?? defaultMutation.error ?? statusesQuery.error;

  return {
    statuses: statusesQuery.data ?? [],
    loading: statusesQuery.isPending,
    isPending,
    error: failure === null ? null : describeError(failure),
    toggle,
    setDefaultModel,
  };
};
