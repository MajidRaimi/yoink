import { useState, type FormEvent, type KeyboardEvent } from "react";
import { create } from "zustand";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type SaveCurrentFormState = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

export const useSaveCurrentForm = create<SaveCurrentFormState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));

type SaveCurrentFormProps = {
  onSave: (name: string) => Promise<boolean>;
};

export const SaveCurrentForm = ({ onSave }: SaveCurrentFormProps) => {
  const open = useSaveCurrentForm((state) => state.open);
  const hide = useSaveCurrentForm((state) => state.hide);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    setSaving(true);
    const saved = await onSave(trimmed);
    setSaving(false);
    if (saved) {
      setName("");
      hide();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") hide();
  };

  return (
    <form
      className="rise flex shrink-0 items-center gap-2 px-3 pb-2"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="profile name"
        className="py-1.5"
      />
      <Button type="submit" disabled={saving || name.trim().length === 0}>
        Save
      </Button>
    </form>
  );
};
