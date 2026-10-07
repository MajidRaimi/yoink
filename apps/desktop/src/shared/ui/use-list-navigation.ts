import { useState, type KeyboardEvent } from "react";

type ListNavigationOptions = {
  count: number;
  columns?: number;
  onActivate: (index: number) => void;
};

type ListNavigation = {
  active: number;
  setActive: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

const clamp = (value: number, count: number): number => (count === 0 ? -1 : Math.max(0, Math.min(value, count - 1)));

const stepFor = (key: string, columns: number): number | null => {
  if (key === "ArrowDown" || key === "j") return columns;
  if (key === "ArrowUp" || key === "k") return -columns;
  if (columns > 1 && (key === "ArrowRight" || key === "l")) return 1;
  if (columns > 1 && (key === "ArrowLeft" || key === "h")) return -1;
  return null;
};

export const useListNavigation = ({ count, columns = 1, onActivate }: ListNavigationOptions): ListNavigation => {
  const [requested, setActive] = useState(0);
  const active = clamp(requested, count);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    const step = stepFor(event.key, columns);
    if (step !== null) {
      event.preventDefault();
      setActive(clamp(active + step, count));
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && active >= 0) {
      if (event.target instanceof HTMLButtonElement && event.target !== event.currentTarget) return;
      event.preventDefault();
      onActivate(active);
    }
  };

  return { active, setActive, handleKeyDown };
};
