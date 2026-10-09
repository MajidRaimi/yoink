"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { desktopRelease, site } from "@/shared/brand/site";
import { ButtonLink, type ButtonSize } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { useMacArch } from "@/features/download/hooks/use-mac-arch";
import { toDownloadHref } from "@/features/download/lib/release";

export type MacDownloadButtonProps = {
  size?: ButtonSize;
  className?: string;
};

export const MacDownloadButton = ({ size = "lg", className }: MacDownloadButtonProps): React.JSX.Element => {
  const { arch } = useMacArch();

  return (
    <ButtonLink href={toDownloadHref(desktopRelease.dmg[arch], site.releasesUrl)} size={size} className={className}>
      <Icon icon={DownloadSimpleIcon} size={18} weight="bold" />
      Download for Mac
    </ButtonLink>
  );
};
