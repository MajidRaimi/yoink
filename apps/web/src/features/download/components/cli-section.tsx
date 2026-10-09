import { site } from "@/shared/brand/site";
import { docHref } from "@/shared/lib/routes";
import { InlineCode } from "@/shared/ui/code";
import { TextLink } from "@/shared/ui/link";
import { InstallTabs } from "@/features/download/install-tabs";

const HEADING_ID = "download-cli";

export const CliSection = (): React.JSX.Element => (
  <section aria-labelledby={HEADING_ID} className="grid gap-10 border-t border-hairline pt-10 lg:grid-cols-2 lg:gap-16">
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 id={HEADING_ID} className="display text-3xl">
          The CLI
        </h2>
        <p className="max-w-xl text-muted">
          Switch Claude, Codex, Kimi, Gemini and Copilot logins, and connect API keys to 13 coding tools. One
          self-contained binary. The install scripts need no runtime, and the npm package runs the same binary through a
          small Node shim.
        </p>
      </div>
      <InstallTabs />
    </div>
    <div className="flex flex-col gap-4 lg:pt-2">
      <h3 className="text-lg font-semibold tracking-tight">Releases and checksums</h3>
      <p className="text-sm text-muted">
        Every CLI release on GitHub ships its archives with a{" "}
        <bdi>
          <InlineCode>checksums.txt</InlineCode>
        </bdi>{" "}
        of SHA-256 sums. Both install scripts verify the archive against it when present, and the Windows script refuses to install without a match.
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        <li>
          <TextLink href={site.releasesUrl}>All releases on GitHub</TextLink>
        </li>
        <li>
          <TextLink href={site.npmUrl}>
            <bdi>{site.npmPackage}</bdi> on npm
          </TextLink>
        </li>
        <li>
          <TextLink href={docHref("getting-started")}>Read the docs</TextLink>
        </li>
      </ul>
    </div>
  </section>
);
