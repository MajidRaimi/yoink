import { site } from "@/shared/brand/site";
import type { DocSlug } from "@/shared/lib/routes";
import type { ExternalHref } from "@/shared/ui/href";

const RAW_HOST = "https://raw.githubusercontent.com/MajidRaimi/yoink";

export const repoBlobUrl = (repoPath: string): ExternalHref => `${site.repo}/blob/main/${repoPath}`;

export const repoRawUrl = (repoPath: string): ExternalHref => `${RAW_HOST}/main/${repoPath}`;

export const docEditUrl = (slug: DocSlug): ExternalHref => `${site.repo}/edit/main/docs/${slug}.md`;
