import type { Metadata } from "next";
import { LANDING_DESCRIPTION, LANDING_TITLE } from "@/features/landing/copy";
import { canonicalPath, routes } from "@/shared/lib/routes";

export const landingMetadata: Metadata = {
  title: { absolute: LANDING_TITLE },
  description: LANDING_DESCRIPTION,
  alternates: { canonical: canonicalPath(routes.home) },
};
