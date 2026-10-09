"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";

export type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = ({ className }: ThemeToggleProps): React.JSX.Element => {
  const { resolvedTheme, setTheme } = useTheme();
  const toggle = (): void => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn(
        "grid size-10 place-items-center rounded-button text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring",
        className,
      )}
    >
      <Icon icon={SunIcon} size={18} className="hidden dark:block" />
      <Icon icon={MoonIcon} size={18} className="block dark:hidden" />
    </button>
  );
};
