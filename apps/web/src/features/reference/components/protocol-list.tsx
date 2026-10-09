import type { Protocol } from "@/shared/contract";
import { PROTOCOL_LABELS } from "../ids";

export type ProtocolListProps = {
  protocols: readonly Protocol[];
};

export const ProtocolList = ({ protocols }: ProtocolListProps): React.JSX.Element => (
  <ul aria-label="Protocols" className="flex flex-wrap gap-1.5">
    {protocols.map((protocol) => (
      <li
        key={protocol}
        title={PROTOCOL_LABELS[protocol]}
        className="rounded-xs border border-hairline px-1.5 py-0.5 font-mono text-xs tracking-mono text-muted"
      >
        {protocol}
      </li>
    ))}
  </ul>
);
