import { slugify } from "../profiles/naming";
import type { SubscriptionIdentity, SubscriptionTool } from "../profiles/types";

const IDENTITY_KEYS = ["accountId", "email"] as const;

const comparable = (value: string | undefined): string | undefined =>
  value === undefined || value.length === 0 ? undefined : value.toLowerCase();

export const sameIdentity = (left: SubscriptionIdentity, right: SubscriptionIdentity): boolean => {
  let compared = 0;
  for (const key of IDENTITY_KEYS) {
    const a = comparable(left[key]);
    const b = comparable(right[key]);
    if (a === undefined || b === undefined) continue;
    if (a !== b) return false;
    compared++;
  }
  return compared > 0;
};

export const defaultSubscriptionName = (tool: SubscriptionTool, identity: SubscriptionIdentity): string => {
  const local = identity.email?.split("@")[0];
  const base = local && local.length > 0 ? local : identity.label;
  if (!/[a-z0-9]/i.test(base)) return tool;
  const slug = slugify(base);
  return slug === tool || slug.startsWith(`${tool}-`) ? slug : `${tool}-${slug}`;
};
