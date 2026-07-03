export const validateHttpUrl = (value: string): string | undefined =>
  /^https?:\/\/.+/.test(value.trim()) ? undefined : "Must start with http:// or https://";

export const requireNonEmpty = (value: string): string | undefined =>
  value.trim().length === 0 ? "This field is required" : undefined;
