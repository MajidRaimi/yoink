import { create } from "zustand";

export type LinkedAccountStore = {
  account: string | null;
  publish: (account: string) => void;
};

export const useLinkedAccountStore = create<LinkedAccountStore>()((set) => ({
  account: null,
  publish: (account) => set({ account }),
}));
