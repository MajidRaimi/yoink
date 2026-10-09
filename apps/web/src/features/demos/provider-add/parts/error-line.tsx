import { Line } from "@/features/demos/provider-add/parts/line";

export const ErrorLine = ({ error }: { error: string | null }): React.JSX.Element | null =>
  error === null ? null : (
    <Line glyph="error">
      <span className="truncate text-danger">{error}</span>
    </Line>
  );
