import pc from "picocolors";

const EXPERIMENTAL_TAG = "experimental";

export const experimentalTag = (experimental: boolean): string => (experimental ? ` ${pc.dim(EXPERIMENTAL_TAG)}` : "");
