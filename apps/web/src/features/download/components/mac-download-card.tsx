import { AppleLogoIcon } from "@phosphor-icons/react/ssr";
import { desktopRelease, site } from "@/shared/brand/site";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";
import { MacDownloadButton } from "@/features/download/components/mac-download-button";
import { MAC_ARCHES, MAC_ARCH_LABELS, MAC_ARCH_NOTES } from "@/features/download/lib/mac-arch";
import { fileNameFromUrl, toDownloadHref } from "@/features/download/lib/release";

export const MacDownloadCard = (): React.JSX.Element => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Icon icon={AppleLogoIcon} size={16} weight="fill" className="text-foreground" />
        <span>
          Version <bdi className="font-mono tracking-mono text-foreground">{desktopRelease.version}</bdi>, macOS 12 or
          later
        </span>
      </p>
    </div>
    <div className="flex">
      <MacDownloadButton />
    </div>
    <ul className="flex flex-col divide-y divide-hairline rounded-md border border-hairline bg-surface">
      {MAC_ARCHES.map((arch) => {
        const note = MAC_ARCH_NOTES[arch];
        return (
          <li key={arch} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="text-sm">
              <span className="font-medium text-foreground">{MAC_ARCH_LABELS[arch]}</span>
              {note === undefined ? null : <span className="text-muted"> ({note})</span>}
            </span>
            <TextLink
              href={toDownloadHref(desktopRelease.dmg[arch], site.releasesUrl)}
              tone="muted"
              className="break-all font-mono text-xs tracking-mono"
            >
              <bdi>{fileNameFromUrl(desktopRelease.dmg[arch])}</bdi>
            </TextLink>
          </li>
        );
      })}
    </ul>
  </div>
);
