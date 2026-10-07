import { isRecord, type UnknownRecord } from "../../shared/guards";
import type { Protocol } from "../profiles/types";

export type ProbeOutcome = "supported" | "unauthorized" | "unsupported";

export type ProbeVerdict = {
  outcome: ProbeOutcome;
  retryWithAnotherModel: boolean;
};

const AUTH_STATUSES = new Set([401, 403]);
const ACCEPTED_CLIENT_ERRORS = new Set([400, 422]);
const NOT_FOUND_STATUS = 404;
const AUTH_ERROR_KINDS = new Set(["authentication_error", "permission_error", "invalid_api_key", "unauthorized"]);
const MODEL_ERROR_KINDS = new Set(["model_not_found"]);
const AUTH_MESSAGE =
  /api[\s_-]?key|unauthori[sz]ed|unauthenticated|authenticat|(?:invalid|expired|incorrect|missing)\s+(?:access\s+)?token\b|\btoken\s+(?:is\s+)?(?:expired|invalid|incorrect|missing)/i;
const MODEL_MESSAGE = /\bmodel\b/i;
const STATUS_CODE_TEXT = /^\d{3}$/;

const isSuccessStatus = (status: number): boolean => status >= 200 && status < 300;

const errorObject = (body: UnknownRecord): UnknownRecord | null => (isRecord(body.error) ? body.error : null);

const errorMessages = (body: unknown): string[] => {
  if (!isRecord(body)) return [];
  const error = errorObject(body);
  return [body.message, body.msg, body.detail, body.error, error?.message, error?.msg].filter(
    (value): value is string => typeof value === "string",
  );
};

const errorCodes = (body: unknown): unknown[] => {
  if (!isRecord(body)) return [];
  const error = errorObject(body);
  return [body.code, error?.code, error?.type];
};

const toStatusCode = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  return typeof value === "string" && STATUS_CODE_TEXT.test(value) ? Number(value) : null;
};

const isAuthCode = (code: unknown): boolean =>
  AUTH_STATUSES.has(toStatusCode(code) ?? 0) || (typeof code === "string" && AUTH_ERROR_KINDS.has(code));

const hasAuthSignal = (body: unknown): boolean =>
  errorCodes(body).some(isAuthCode) || errorMessages(body).some((message) => AUTH_MESSAGE.test(message));

const hasModelMissingSignal = (body: unknown): boolean =>
  errorCodes(body).some((code) => typeof code === "string" && MODEL_ERROR_KINDS.has(code)) ||
  errorMessages(body).some((message) => MODEL_MESSAGE.test(message));

const hasErrorEnvelope = (body: unknown): boolean => {
  if (!isRecord(body)) return false;
  const error = body.error;
  const hasError = isRecord(error) || (typeof error === "string" && error.length > 0);
  return hasError || body.type === "error" || body.object === "error" || body.detail !== undefined;
};

const hasSuccessShape = (protocol: Protocol, body: unknown): boolean => {
  if (!isRecord(body)) return false;
  if (protocol === "openai-chat") return Array.isArray(body.choices);
  if (protocol === "openai-responses") return body.object === "response" || Array.isArray(body.output);
  return body.type === "message";
};

const verdict = (outcome: ProbeOutcome, retryWithAnotherModel = false): ProbeVerdict => ({
  outcome,
  retryWithAnotherModel,
});

export const classifyProbeResponse = (protocol: Protocol, status: number, body: unknown): ProbeVerdict => {
  if (isSuccessStatus(status) && hasSuccessShape(protocol, body)) return verdict("supported");
  if (AUTH_STATUSES.has(status) || hasAuthSignal(body)) return verdict("unauthorized");
  if (!hasErrorEnvelope(body)) return verdict("unsupported");
  if (ACCEPTED_CLIENT_ERRORS.has(status)) return verdict("supported");
  if (status !== NOT_FOUND_STATUS) return verdict("unsupported");
  return hasModelMissingSignal(body) ? verdict("supported") : verdict("unsupported", true);
};

export const classifyListingFailure = (status: number, body: unknown): ProbeOutcome =>
  AUTH_STATUSES.has(status) || hasAuthSignal(body) ? "unauthorized" : "unsupported";
