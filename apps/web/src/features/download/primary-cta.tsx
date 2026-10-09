"use client";

import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import { CopyCommand } from "@/shared/ui/copy-command";
import { TextLink } from "@/shared/ui/link";
import type { Platform } from "@/shared/contract";
import { ArchChooser } from "@/features/download/components/arch-chooser";
import { MacDownloadButton } from "@/features/download/components/mac-download-button";
import { PlatformScript } from "@/features/download/components/platform-script";
import { usePlatform } from "@/features/download/hooks/use-platform";
import { installCommandForPlatform } from "@/features/download/lib/install-options";

export type PrimaryCtaProps = {
  className?: string;
};

const primaryRow = "flex h-13 items-center gap-5";

const secondaryRow = "flex h-10 items-center gap-4";

const variant = "flex-col gap-3";

const macVariant = cn(variant, "hidden group-data-[platform=mac]/cta:flex [:root[data-yoink-platform=mac]_&]:flex");

const cliVariant = cn(variant, "flex group-data-[platform=mac]/cta:hidden [:root[data-yoink-platform=mac]_&]:hidden");

const MacCta = (): React.JSX.Element => (
  <div className={macVariant}>
    <div className={primaryRow}>
      <MacDownloadButton />
      <TextLink href={routes.install} className="text-sm font-medium">
        Install the CLI
      </TextLink>
    </div>
    <div className={secondaryRow}>
      <ArchChooser />
    </div>
  </div>
);

type CliCtaProps = {
  platform: Exclude<Platform, "mac">;
};

const CliCta = ({ platform }: CliCtaProps): React.JSX.Element => (
  <div className={cliVariant}>
    <div className={primaryRow}>
      <CopyCommand
        command={installCommandForPlatform(platform)}
        prompt={platform === "windows" ? ">" : "$"}
        className="w-full max-w-xl"
      />
    </div>
    <div className={secondaryRow}>
      <TextLink href={routes.docs} className="text-sm font-medium">
        Read the docs
      </TextLink>
    </div>
  </div>
);

export const PrimaryCta = ({ className }: PrimaryCtaProps): React.JSX.Element => {
  const platform = usePlatform();

  return (
    <div data-platform={platform} className={cn("group/cta flex h-26 w-full max-w-xl flex-col", className)}>
      <PlatformScript />
      <MacCta />
      <CliCta platform={platform === "mac" ? "unknown" : platform} />
    </div>
  );
};
