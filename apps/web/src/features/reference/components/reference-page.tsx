import { docHref } from "@/shared/lib/routes";
import { InlineCode } from "@/shared/ui/code";
import { Container } from "@/shared/ui/container";
import { TextLink } from "@/shared/ui/link";
import { CommandBrowser } from "./command-browser";
import { HarnessIdsSection, KeymapSection, PresetIdsSection, ToolIdsSection } from "./id-sections";
import { OnThisPage } from "./on-this-page";

export const REFERENCE_TITLE = "CLI reference";

export const REFERENCE_DESCRIPTION =
  "Every yoink command, alias and flag with an example, plus the menu keymap and the tool, harness and preset ids.";

export const ReferencePage = (): React.JSX.Element => (
  <Container size="wide" className="py-14 sm:py-20">
    <header className="max-w-3xl">
      <h1 className="display text-4xl sm:text-5xl">{REFERENCE_TITLE}</h1>
      <p className="mt-4 text-lg text-muted">
        Every command the <InlineCode>yoink</InlineCode> binary accepts, grouped by what it works on. For walkthroughs
        and longer examples, see <TextLink href={docHref("usage")}>Usage</TextLink>.
      </p>
    </header>
    <div className="mt-12 grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
      <aside aria-label="Table of contents" className="min-w-0">
        <OnThisPage />
      </aside>
      <div className="flex min-w-0 flex-col gap-20">
        <CommandBrowser />
        <KeymapSection />
        <ToolIdsSection />
        <HarnessIdsSection />
        <PresetIdsSection />
      </div>
    </div>
  </Container>
);
