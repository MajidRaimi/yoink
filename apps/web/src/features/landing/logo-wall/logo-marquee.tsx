"use client";

import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { LogoList } from "@/features/landing/logo-wall/logo-list";
import type { BrandLogo } from "@/shared/brand/logos";
import { cx } from "@/shared/lib/cx";
import { useDisclosure } from "@/shared/lib/use-disclosure";
import { Icon } from "@/shared/ui/icon";
import styles from "./logo-marquee.module.css";

export type LogoMarqueeProps = {
  logos: readonly BrandLogo[];
  label: string;
};

export const LogoMarquee = ({ logos, label }: LogoMarqueeProps): React.JSX.Element => {
  const { open: paused, toggle } = useDisclosure(false);

  return (
    <div className="flex items-center gap-3">
      <div dir="ltr" className={cx(styles.viewport, "min-w-0 flex-1 py-2")} data-paused={paused}>
        <div className={styles.track}>
          <LogoList logos={logos} className={styles.list} />
          <LogoList logos={logos} className={cx(styles.list, styles.duplicate)} hidden />
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={paused}
        aria-label={`Pause ${label}`}
        className={cx(
          styles.control,
          "grid size-9 shrink-0 place-items-center rounded-button text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring",
        )}
      >
        <Icon icon={paused ? PlayIcon : PauseIcon} size={16} weight="fill" />
      </button>
    </div>
  );
};
