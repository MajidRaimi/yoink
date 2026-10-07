export const validateHttpUrl = (value: string): string | undefined =>
  /^https?:\/\/.+/.test(value.trim()) ? undefined : "Must start with http:// or https://";

export const requireNonEmpty = (value: string): string | undefined =>
  value.trim().length === 0 ? "This field is required" : undefined;

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export const validateProviderId = (value: string): string | undefined =>
  PROVIDER_ID_PATTERN.test(value.trim())
    ? undefined
    : "Use letters, digits, dots, dashes or underscores (harness configs use this as the provider id)";
