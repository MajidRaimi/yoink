import { createHash } from "node:crypto";

const READABLE_PROVIDER_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FINGERPRINT_LENGTH = 8;
export const FINGERPRINT_SUFFIX = new RegExp(`__H[0-9A-F]{${FINGERPRINT_LENGTH}}$`);

const fingerprint = (providerId: string): string =>
  createHash("sha256").update(providerId).digest("hex").slice(0, FINGERPRINT_LENGTH).toUpperCase();

const upperSnake = (providerId: string): string =>
  providerId.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export const envNameSegment = (providerId: string): string =>
  READABLE_PROVIDER_ID.test(providerId)
    ? upperSnake(providerId)
    : `${upperSnake(providerId)}__H${fingerprint(providerId)}`;
