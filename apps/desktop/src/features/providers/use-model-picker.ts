import { useMemo, useState, type KeyboardEvent } from "react";
import type { ModelRef } from "@/shared/types";

export type PickerRow = { kind: "model"; model: ModelRef } | { kind: "custom"; id: string };

type ModelPickerOptions = {
  options: readonly ModelRef[];
  selected: readonly string[];
  allowCustom: boolean;
  onChange: (ids: string[]) => void;
};

type ModelPickerState = {
  query: string;
  setQuery: (query: string) => void;
  rows: PickerRow[];
  highlighted: number;
  setHighlighted: (index: number) => void;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  activate: (row: PickerRow) => void;
  selectVisible: () => void;
  clear: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

const mergeSelected = (options: readonly ModelRef[], selected: readonly string[]): ModelRef[] => {
  const known = new Set(options.map((option) => option.id));
  const extras = selected.filter((id) => !known.has(id)).map((id) => ({ id, name: id }));
  return [...extras, ...options];
};

const matches = (model: ModelRef, term: string): boolean =>
  model.id.toLowerCase().includes(term) || model.name.toLowerCase().includes(term);

export const useModelPicker = ({ options, selected, allowCustom, onChange }: ModelPickerOptions): ModelPickerState => {
  const [query, setRawQuery] = useState("");
  const [requested, setHighlighted] = useState(0);

  const universe = useMemo(() => mergeSelected(options, selected), [options, selected]);

  const rows = useMemo((): PickerRow[] => {
    const raw = query.trim();
    const term = raw.toLowerCase();
    const models = term.length === 0 ? universe : universe.filter((model) => matches(model, term));
    const modelRows = models.map((model): PickerRow => ({ kind: "model", model }));
    const exact = universe.some((model) => model.id === raw);
    return allowCustom && raw.length > 0 && !exact ? [...modelRows, { kind: "custom", id: raw }] : modelRows;
  }, [universe, query, allowCustom]);

  const highlighted = rows.length === 0 ? -1 : Math.min(requested, rows.length - 1);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const isSelected = (id: string): boolean => selectedSet.has(id);

  const toggle = (id: string): void =>
    onChange(selectedSet.has(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);

  const setQuery = (next: string): void => {
    setRawQuery(next);
    setHighlighted(0);
  };

  const activate = (row: PickerRow): void => {
    if (row.kind === "model") {
      toggle(row.model.id);
      return;
    }
    toggle(row.id);
    setQuery("");
  };

  const selectVisible = (): void => {
    const visible = rows.flatMap((row) => (row.kind === "model" ? [row.model.id] : []));
    onChange([...selected, ...visible.filter((id) => !selectedSet.has(id))]);
  };

  const clear = (): void => onChange([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted(Math.min(highlighted + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted(Math.max(highlighted - 1, 0));
    } else if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      const row = rows[highlighted];
      if (row) activate(row);
    }
  };

  return { query, setQuery, rows, highlighted, setHighlighted, isSelected, toggle, activate, selectVisible, clear, handleKeyDown };
};
