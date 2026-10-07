import { isRecord, readString } from "../../../shared/guards";

export type JwtClaims = Readonly<Record<string, unknown>>;

const decodeSegment = (segment: string): unknown => {
  const text = Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(text);
};

export const decodeJwtPayload = (token: unknown): JwtClaims | null => {
  if (typeof token !== "string") return null;
  const segments = token.split(".");
  const payload = segments[1];
  if (segments.length !== 3 || !payload) return null;
  try {
    const decoded = decodeSegment(payload);
    return isRecord(decoded) ? decoded : null;
  } catch {
    return null;
  }
};

export const claimAt = (claims: JwtClaims | null, path: readonly string[]): unknown => {
  let cursor: unknown = claims;
  for (const key of path) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[key];
  }
  return cursor;
};

export const stringClaim = (claims: JwtClaims | null, ...path: string[]): string | undefined => {
  const value = claimAt(claims, path);
  return readString(value) ?? (typeof value === "number" && Number.isFinite(value) ? String(value) : undefined);
};
