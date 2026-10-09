"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cx } from "@/shared/lib/cx";
import { useHydrated } from "@/shared/ui/use-hydrated";
import { Icon } from "@/shared/ui/icon";

export type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = ({ className }: ThemeToggleProps): React.JSX.Element => {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = resolvedTheme === "dark";
  const toggle = (): void => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Dark mode"
      aria-pressed={hydrated && resolvedTheme !== undefined ? isDark : undefined}
      className={cx(
        "grid size-10 place-items-center rounded-button text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring",
        className,
      )}
    >
      <Icon icon={SunIcon} size={18} className="hidden dark:block" />
      <Icon icon={MoonIcon} size={18} className="block dark:hidden" />
    </button>
  );
};
