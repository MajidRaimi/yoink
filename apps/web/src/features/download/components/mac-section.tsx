import { DesktopFeatures } from "@/features/download/components/desktop-features";
import { MacDownloadCard } from "@/features/download/components/mac-download-card";

const HEADING_ID = "download-mac";

export const MacSection = (): React.JSX.Element => (
  <section
    aria-labelledby={HEADING_ID}
    className="grid gap-10 border-t border-hairline pt-10 [:root[data-yoink-platform=mac]_&]:-order-1 lg:grid-cols-2 lg:gap-16"
  >
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 id={HEADING_ID} className="display text-3xl">
          Yoink for Mac
        </h2>
        <p className="max-w-xl text-muted">
          The menu bar app for your Claude Code accounts and API-key providers. Drag it to Applications and it lives in
          the menu bar.
        </p>
      </div>
      <MacDownloadCard />
    </div>
    <DesktopFeatures />
  </section>
);
