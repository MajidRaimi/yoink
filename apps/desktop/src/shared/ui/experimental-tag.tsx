import type { ReactElement } from "react";

export const ExperimentalTag = ({ experimental }: { experimental: boolean }): ReactElement | null =>
  experimental ? <span className="shrink-0 text-[10px] text-faint">experimental</span> : null;
