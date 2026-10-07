import { pageMetadata } from "@/lib/seo";
import ProvidersPage from "../providers/page";

export const metadata = pageMetadata({
  title: "Providers",
  description: "Add an API key once and use it in pi, opencode, codex, Claude Code, Qwen Code, Zed, and more.",
  path: "/docs/providers/",
});

export default ProvidersPage;
