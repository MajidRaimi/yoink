import { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  profiles: ["profiles"] as const,
  presets: ["presets"] as const,
  harnesses: (name: string) => ["harnesses", name] as const,
  allHarnesses: ["harnesses"] as const,
};

export const providerMutations = (name: string): { mutationKey: readonly ["provider-mutation", string]; scope: { id: string } } => ({
  mutationKey: ["provider-mutation", name] as const,
  scope: { id: `provider:${name}` },
});

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
