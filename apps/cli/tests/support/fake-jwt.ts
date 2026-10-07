const base64Url = (value: unknown): string => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

export const fakeJwt = (claims: Record<string, unknown>): string =>
  `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url(claims)}.fake-signature`;
