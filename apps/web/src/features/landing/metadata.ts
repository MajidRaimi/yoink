import type { Metadata } from "next";
import { LANDING_DESCRIPTION, LANDING_TITLE } from "@/features/landing/copy";
import { pageMetadata } from "@/features/seo/metadata";
import { routes } from "@/shared/lib/routes";

export const landingMetadata: Metadata = {
  ...pageMetadata({ title: LANDING_TITLE, description: LANDING_DESCRIPTION, path: routes.home }),
  title: { absolute: LANDING_TITLE },
};
