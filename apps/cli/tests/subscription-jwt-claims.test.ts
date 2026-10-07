import { expect, test } from "bun:test";
import { claimAt, decodeJwtPayload, stringClaim } from "../src/features/subscriptions/shared/jwt-claims";
import { fakeJwt } from "./support/fake-jwt";

const token = fakeJwt({
  email: "me@example.com",
  user_id: 42,
  "https://api.openai.com/auth": { chatgpt_plan_type: "pro", chatgpt_account_id: "acct-9" },
});

test("decodeJwtPayload reads the payload without verifying", () => {
  expect(decodeJwtPayload(token)?.email).toBe("me@example.com");
});

test("decodeJwtPayload returns null for anything that is not a JWT", () => {
  expect(decodeJwtPayload(undefined)).toBeNull();
  expect(decodeJwtPayload(12)).toBeNull();
  expect(decodeJwtPayload("")).toBeNull();
  expect(decodeJwtPayload("a.b")).toBeNull();
  expect(decodeJwtPayload("a.!!!.c")).toBeNull();
  expect(decodeJwtPayload(`x.${Buffer.from("[1]").toString("base64url")}.y`)).toBeNull();
  expect(decodeJwtPayload(`x.${Buffer.from("not json").toString("base64url")}.y`)).toBeNull();
});

test("stringClaim walks nested claims and stringifies numbers", () => {
  const claims = decodeJwtPayload(token);
  expect(stringClaim(claims, "https://api.openai.com/auth", "chatgpt_plan_type")).toBe("pro");
  expect(stringClaim(claims, "user_id")).toBe("42");
  expect(stringClaim(claims, "missing", "deeper")).toBeUndefined();
  expect(stringClaim(null, "email")).toBeUndefined();
  expect(claimAt(claims, ["https://api.openai.com/auth"])).toEqual({ chatgpt_plan_type: "pro", chatgpt_account_id: "acct-9" });
});

test("decodeJwtPayload accepts standard base64 padding variants", () => {
  const padded = `h.${Buffer.from(JSON.stringify({ sub: "s?>" })).toString("base64")}.s`;
  expect(decodeJwtPayload(padded)?.sub).toBe("s?>");
});
