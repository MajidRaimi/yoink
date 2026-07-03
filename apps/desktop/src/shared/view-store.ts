import { create } from "zustand";

export type View = "list" | "settings" | "login" | "external";

type ViewState = {
  view: View;
  editingExternal: string | null;
  setView: (view: View) => void;
  openExternalForm: (name?: string) => void;
};

export const useViewStore = create<ViewState>((set) => ({
  view: "list",
  editingExternal: null,
  setView: (view) => set({ view }),
  openExternalForm: (name) => set({ view: "external", editingExternal: name ?? null }),
}));
