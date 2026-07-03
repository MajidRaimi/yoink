import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ipc } from "@/shared/ipc";
import type { ExternalInput, ExternalProfile } from "@/shared/types";
import { useViewStore } from "@/shared/view-store";
import { Button, IconButton } from "@/shared/ui/button";
import { useEscapeKey } from "@/shared/ui/dialog";
import { ArrowLeftIcon } from "@/shared/ui/icons";
import { Input, Select } from "@/shared/ui/input";
import { describeError } from "./use-profiles";

type ProviderPreset = { name: string; baseUrl: string };

const CUSTOM_PRESET = "Custom";

const PROVIDER_PRESETS: ProviderPreset[] = [
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api" },
  { name: "Moonshot", baseUrl: "https://api.moonshot.ai/anthropic" },
  { name: "Z.ai", baseUrl: "https://api.z.ai/api/anthropic" },
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/anthropic" },
];

type Draft = {
  name: string;
  preset: string;
  provider: string;
  baseUrl: string;
  model: string;
  token: string;
};

const initialDraft: Draft = {
  name: "",
  preset: "OpenRouter",
  provider: "OpenRouter",
  baseUrl: "https://openrouter.ai/api",
  model: "",
  token: "",
};

const presetFor = (provider: string): string =>
  PROVIDER_PRESETS.find((preset) => preset.name === provider)?.name ?? CUSTOM_PRESET;

const normalizeBaseUrl = (raw: string): string => raw.trim().replace(/\/+$/, "");

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] text-muted">{label}</span>
    {children}
  </label>
);

const useExternalDraft = (editingName: string | null) => {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (editingName === null) return;
    let cancelled = false;
    ipc
      .listProfiles()
      .then((store) => {
        if (cancelled) return;
        const profile = store.profiles.find(
          (entry): entry is ExternalProfile => entry.type === "external" && entry.name === editingName,
        );
        if (!profile) return;
        setDraft({
          name: profile.name,
          preset: presetFor(profile.provider),
          provider: profile.provider,
          baseUrl: profile.baseUrl,
          model: profile.model,
          token: "",
        });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setLoadError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [editingName]);

  const setField = (key: keyof Draft) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (presetName: string) => {
    const preset = PROVIDER_PRESETS.find((entry) => entry.name === presetName);
    setDraft((prev) =>
      preset
        ? { ...prev, preset: preset.name, provider: preset.name, baseUrl: preset.baseUrl }
        : { ...prev, preset: CUSTOM_PRESET },
    );
  };

  return { draft, setField, applyPreset, loadError };
};

const validate = (draft: Draft, editing: boolean): string | null => {
  if (draft.name.trim().length === 0) return "A profile name is required";
  if (draft.provider.trim().length === 0) return "A provider name is required";
  if (!/^https?:\/\//.test(draft.baseUrl.trim())) return "Base URL must start with http:// or https://";
  if (draft.model.trim().length === 0) return "A model id is required";
  if (!editing && draft.token.trim().length === 0) return "An API key is required";
  return null;
};

export const ExternalForm = () => {
  const editingName = useViewStore((state) => state.editingExternal);
  const setView = useViewStore((state) => state.setView);
  const { draft, setField, applyPreset, loadError } = useExternalDraft(editingName);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEscapeKey(() => setView("list"));

  const error = submitError ?? loadError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validate(draft, editingName !== null);
    if (problem !== null) {
      setSubmitError(problem);
      return;
    }
    const token = draft.token.trim();
    const input: ExternalInput = {
      name: draft.name.trim(),
      provider: draft.provider.trim(),
      baseUrl: normalizeBaseUrl(draft.baseUrl),
      model: draft.model.trim(),
      ...(token.length > 0 ? { token } : {}),
    };
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingName === null) await ipc.addExternal(input);
      else await ipc.editExternal(editingName, input);
      setView("list");
    } catch (cause) {
      setSubmitError(describeError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rise flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 px-3 pt-3">
        <IconButton label="Back" onClick={() => setView("list")}>
          <ArrowLeftIcon />
        </IconButton>
        <h1 className="font-sans text-[14px] font-medium text-foreground">
          {editingName !== null ? `Edit ${editingName}` : "External provider"}
        </h1>
      </div>
      <form className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-4" onSubmit={handleSubmit}>
        <Field label="Name">
          <Input
            autoFocus={editingName === null}
            value={draft.name}
            onChange={(event) => setField("name")(event.target.value)}
            placeholder="openrouter"
          />
        </Field>
        <Field label="Provider">
          <Select value={draft.preset} onChange={(event) => applyPreset(event.target.value)}>
            {PROVIDER_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
            <option value={CUSTOM_PRESET}>{CUSTOM_PRESET}</option>
          </Select>
        </Field>
        {draft.preset === CUSTOM_PRESET && (
          <Field label="Provider name">
            <Input
              value={draft.provider}
              onChange={(event) => setField("provider")(event.target.value)}
              placeholder="My gateway"
            />
          </Field>
        )}
        <Field label="Base URL">
          <Input
            value={draft.baseUrl}
            onChange={(event) => setField("baseUrl")(event.target.value)}
            placeholder="https://openrouter.ai/api"
          />
        </Field>
        <Field label="Model">
          <Input
            value={draft.model}
            onChange={(event) => setField("model")(event.target.value)}
            placeholder="anthropic/claude-sonnet-4.5"
          />
        </Field>
        <Field label="API key">
          <Input
            type="password"
            value={draft.token}
            onChange={(event) => setField("token")(event.target.value)}
            placeholder={editingName !== null ? "unchanged" : "sk-…"}
          />
        </Field>
        {error !== null && <p className="font-mono text-[11px] text-[#f87171]">{error}</p>}
        <div className="mt-auto flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setView("list")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};
