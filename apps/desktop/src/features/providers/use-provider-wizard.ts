import { create } from "zustand";
import type { HarnessId, ProbeResult, ProviderPreset } from "@/shared/types";

export type WizardStep = "source" | "key" | "models" | "harnesses" | "done";

export type AddedProvider = {
  name: string;
  harnesses: HarnessId[];
};

export type WizardDraftField = "name" | "displayName" | "baseUrl" | "token";

type WizardState = {
  step: WizardStep;
  preset: ProviderPreset | null;
  name: string;
  displayName: string;
  baseUrl: string;
  token: string;
  probe: ProbeResult | null;
  models: string[];
  harnesses: HarnessId[];
  defaultModel: string | null;
  added: AddedProvider | null;
  choosePreset: (preset: ProviderPreset | null) => void;
  setField: (field: WizardDraftField, value: string) => void;
  acceptProbe: (probe: ProbeResult) => void;
  setModels: (models: string[]) => void;
  toggleHarness: (id: HarnessId) => void;
  setDefaultModel: (model: string | null) => void;
  goTo: (step: WizardStep) => void;
  finish: (added: AddedProvider) => void;
  reset: () => void;
};

const initialDraft: Omit<
  WizardState,
  "choosePreset" | "setField" | "acceptProbe" | "setModels" | "toggleHarness" | "setDefaultModel" | "goTo" | "finish" | "reset"
> = {
  step: "source",
  preset: null,
  name: "",
  displayName: "",
  baseUrl: "",
  token: "",
  probe: null,
  models: [],
  harnesses: [],
  defaultModel: null,
  added: null,
};

const PREVIOUS_STEP: Record<WizardStep, WizardStep | null> = {
  source: null,
  key: "source",
  models: "key",
  harnesses: "models",
  done: null,
};

export const previousStep = (step: WizardStep): WizardStep | null => PREVIOUS_STEP[step];

export const useProviderWizard = create<WizardState>((set) => ({
  ...initialDraft,
  choosePreset: (preset) =>
    set({
      ...initialDraft,
      step: "key",
      preset,
      name: preset?.id ?? "",
      displayName: preset?.label ?? "",
    }),
  setField: (field, value) => set({ [field]: value }),
  acceptProbe: (probe) =>
    set((state) => {
      const available = new Set(probe.models.map((model) => model.id));
      return {
        probe,
        step: "models",
        models: state.models.filter((id) => available.has(id)),
        harnesses: [],
        defaultModel: null,
      };
    }),
  setModels: (models) =>
    set((state) => ({
      models,
      defaultModel: state.defaultModel !== null && models.includes(state.defaultModel) ? state.defaultModel : null,
    })),
  toggleHarness: (id) =>
    set((state) => ({
      harnesses: state.harnesses.includes(id)
        ? state.harnesses.filter((entry) => entry !== id)
        : [...state.harnesses, id],
    })),
  setDefaultModel: (defaultModel) => set({ defaultModel }),
  goTo: (step) => set({ step }),
  finish: (added) => set({ ...initialDraft, step: "done", added }),
  reset: () => set(initialDraft),
}));
