import { Apple, Download, ListChecks, SquareTerminal } from "lucide-react";
import { CodeBlock } from "@/components/custom/code-block";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";
import { pageMetadata } from "@/lib/seo";
import { desktopDmgUrl, site } from "@/lib/site";
import { DesktopDownloadButtons } from "../_components/desktop-download";

export const metadata = pageMetadata({
  title: "Download",
  description: "Download Yoink for macOS - the menu bar app to switch Claude Code accounts.",
  path: "/download/",
});

const platforms = [
  { arch: "aarch64" as const, label: "Apple Silicon", note: "M1, M2, M3, and newer Macs." },
  { arch: "x64" as const, label: "Intel", note: "Intel-based Macs." },
];

const DownloadPage = () => (
  <div className="mx-auto flex max-w-6xl justify-center px-5 pt-32 pb-24">
    <DocsPage
      title="Download Yoink for macOS"
      description="The menu bar app that snapshots your Claude Code logins and swaps them in a click. Notarized by Apple."
      path="/download/"
    >
      <DesktopDownloadButtons className="items-start" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {platforms.map((platform) => (
          <a
            key={platform.arch}
            href={desktopDmgUrl(platform.arch)}
            className="group flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-brand/40"
          >
            <span className="flex items-center gap-2">
              <Apple className="size-4 text-brand-text" strokeWidth={2} />
              <span className="font-medium text-foreground">{platform.label}</span>
            </span>
            <span className="text-[13px] text-muted">{platform.note}</span>
            <span className="mt-1 flex items-center gap-2 font-mono text-[12px] text-faint transition-colors group-hover:text-brand-text">
              <Download className="size-3.5 shrink-0" strokeWidth={2} />
              <bdi>
                Yoink_{site.desktopVersion}_{platform.arch}.dmg
              </bdi>
            </span>
          </a>
        ))}
      </div>

      <DocsSection heading="System requirements" icon={ListChecks}>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-faint">
          <li>macOS 12 Monterey or later.</li>
          <li>Apple Silicon and Intel are both supported.</li>
          <li>Notarized by Apple, so Gatekeeper opens it without warnings.</li>
        </ul>
      </DocsSection>

      <DocsSection heading="Prefer the CLI?" icon={SquareTerminal}>
        <p>
          Yoink ships as a single-binary CLI too. Install it and switch accounts without leaving the
          terminal.
        </p>
        <CodeBlock code={site.installCommand} prompt />
        <CodeBlock code={site.installCommandWindows} prompt />
        <CodeBlock code={`npm install -g ${site.npmPackage}`} prompt />
      </DocsSection>
    </DocsPage>
  </div>
);

export default DownloadPage;
