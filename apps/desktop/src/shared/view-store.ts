import { create } from "zustand";

export type View = "list" | "settings" | "login" | "external" | "provider-wizard" | "harnesses";

type ViewState = {
  view: View;
  editingExternal: string | null;
  selectedProvider: string | null;
  externalReturn: View;
  setView: (view: View) => void;
  openExternalForm: (name: string, returnTo?: View) => void;
  openProviderWizard: () => void;
  openHarnesses: (name: string) => void;
};

export const useViewStore = create<ViewState>((set) => ({
  view: "list",
  editingExternal: null,
  selectedProvider: null,
  externalReturn: "list",
  setView: (view) => set({ view }),
  openExternalForm: (name, returnTo = "list") => set({ view: "external", editingExternal: name, externalReturn: returnTo }),
  openProviderWizard: () => set({ view: "provider-wizard" }),
  openHarnesses: (name) => set({ view: "harnesses", selectedProvider: name }),
}));
