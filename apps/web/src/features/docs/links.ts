import { site } from "@/shared/brand/site";
import type { ExternalHref } from "@/shared/ui/href";

const RAW_HOST: ExternalHref = `https://raw.githubusercontent.com${new URL(site.repo).pathname}`;

export const repoBlobUrl = (repoPath: string): ExternalHref => `${site.repo}/blob/main/${repoPath}`;

export const repoRawUrl = (repoPath: string): ExternalHref => `${RAW_HOST}/main/${repoPath}`;

export const repoEditUrl = (repoPath: string): ExternalHref => `${site.repo}/edit/main/${repoPath}`;
