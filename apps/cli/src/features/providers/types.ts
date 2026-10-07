import type { Endpoint } from "../profiles/types";

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type ProviderModel = {
  id: string;
  name: string;
};

export type ProbeResult = {
  endpoints: Endpoint[];
  models: ProviderModel[];
};
