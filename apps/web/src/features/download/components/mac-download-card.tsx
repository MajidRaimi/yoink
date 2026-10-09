import { AppleLogoIcon } from "@phosphor-icons/react/ssr";
import { desktopRelease, site } from "@/shared/brand/site";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";
import { ArchChooser } from "@/features/download/components/arch-chooser";
import { MacDownloadButton } from "@/features/download/components/mac-download-button";
import { MAC_ARCHES, MAC_ARCH_LABELS, MAC_ARCH_NOTES } from "@/features/download/lib/mac-arch";
import { fileNameFromUrl, toDownloadHref } from "@/features/download/lib/release";

export const MacDownloadCard = (): React.JSX.Element => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Icon icon={AppleLogoIcon} size={16} weight="fill" className="text-foreground" />
        <span>
          Version <bdi className="font-mono tracking-mono text-foreground">{desktopRelease.version}</bdi>, notarized by
          Apple, macOS 12 or later
        </span>
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <MacDownloadButton />
      <ArchChooser />
    </div>
    <ul className="flex flex-col divide-y divide-hairline rounded-md border border-hairline bg-surface">
      {MAC_ARCHES.map((arch) => {
        const note = MAC_ARCH_NOTES[arch];
        return (
          <li key={arch} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
            <span className="text-sm">
              <span className="font-medium text-foreground">{MAC_ARCH_LABELS[arch]}</span>
              {note === undefined ? null : <span className="text-muted"> ({note})</span>}
            </span>
            <TextLink
              href={toDownloadHref(desktopRelease.dmg[arch], site.releasesUrl)}
              tone="muted"
              className="font-mono text-xs tracking-mono"
            >
              <bdi>{fileNameFromUrl(desktopRelease.dmg[arch])}</bdi>
            </TextLink>
          </li>
        );
      })}
    </ul>
  </div>
);
