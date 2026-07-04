import { pageMetadata } from "@/lib/seo";
import { DocsIndexGrid } from "./_components/docs-index-grid";

export const metadata = pageMetadata({
  title: "Documentation",
  description: "Guides and reference for the Yoink CLI.",
  path: "/docs/",
});

const DocsIndexPage = () => (
  <div className="min-w-0 max-w-[72ch]">
    <p className="mb-4 font-mono text-xs text-faint">documentation</p>
    <h1 className="display text-3xl sm:text-4xl">Everything Yoink does</h1>
    <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-muted">
      From the first install to the exact files a switch touches. Start with the guide you need, or
      jump to the full command reference.
    </p>
    <DocsIndexGrid />
  </div>
);

export default DocsIndexPage;
