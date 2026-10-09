import { Container } from "@/shared/ui/container";
import { CliSection } from "@/features/download/components/cli-section";
import { MacSection } from "@/features/download/components/mac-section";
import { PlatformOrder } from "@/features/download/components/platform-order";
import { PlatformScript } from "@/features/download/components/platform-script";

export const DOWNLOAD_TITLE = "Download";

export const DOWNLOAD_DESCRIPTION =
  "Download the Yoink menu bar app for macOS, or install the CLI on macOS, Linux and Windows to switch AI coding logins and providers.";

export const DownloadPage = (): React.JSX.Element => (
  <Container className="py-16 sm:py-24">
    <PlatformScript />
    <header className="flex max-w-3xl flex-col gap-4">
      <h1 className="display text-4xl sm:text-5xl">Download Yoink</h1>
      <p className="text-lg text-muted">
        The menu bar app runs on macOS. The CLI runs on macOS, Linux and Windows.
      </p>
    </header>
    <div className="mt-12 flex flex-col gap-16 sm:mt-16">
      <PlatformOrder mac={<MacSection />} cli={<CliSection />} />
    </div>
  </Container>
);
