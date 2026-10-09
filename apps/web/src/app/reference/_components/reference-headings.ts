import { REFERENCE_SECTIONS } from "@/features/reference/sections";
import type { DocHeading } from "@/shared/contract";

export const REFERENCE_HEADINGS: readonly DocHeading[] = REFERENCE_SECTIONS.map((section) => ({
  id: section.id,
  text: section.title,
  depth: 2,
}));
