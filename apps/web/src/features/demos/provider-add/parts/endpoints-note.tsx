import { Line } from "@/features/demos/provider-add/parts/line";
import type { ProviderSource } from "@/features/demos/provider-add/sources";

export const EndpointsNote = ({ source }: { source: ProviderSource }): React.JSX.Element => (
  <>
    <Line glyph="answered">
      <span className="truncate text-foreground">{`${source.models.length} models found`}</span>
    </Line>
    {source.endpoints.map((endpoint) => (
      <Line key={endpoint.protocol}>
        <span className="shrink-0 text-success">{endpoint.protocol}</span>
        <span className="min-w-0 truncate text-faint">{endpoint.baseUrl}</span>
      </Line>
    ))}
  </>
);
