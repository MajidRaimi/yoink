import { Line } from "@/features/demos/provider-add/parts/line";
import type { State } from "@/features/demos/provider-add/machine";
import { maskKey } from "@/features/demos/provider-add/selectors";

const KEY_PREVIEW_LENGTH = 12;

const sourceSummary = (state: State): string | null => {
  const source = state.source;
  if (source === null) return null;
  return source.customBaseUrl === null ? source.displayName : `${source.displayName} (custom) ${source.customBaseUrl}`;
};

const trailParts = (state: State): readonly string[] => {
  const parts: string[] = [];
  const source = sourceSummary(state);
  if (source !== null && state.phase !== "key") parts.push(source);
  if (state.phase !== "key" && state.key !== "") parts.push(maskKey(state.key).slice(0, KEY_PREVIEW_LENGTH));
  if (state.savedModels.length > 0 && !(state.phase === "models" && state.editing)) {
    parts.push(`${state.savedModels.length} models`);
  }
  return parts;
};

export const Trail = ({ state }: { state: State }): React.JSX.Element | null => {
  const parts = trailParts(state);
  if (parts.length === 0 || state.phase === "cancelled") return null;
  return (
    <Line glyph="answered">
      <span className="truncate text-muted">{parts.join("  ·  ")}</span>
    </Line>
  );
};
