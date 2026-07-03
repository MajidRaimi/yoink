"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

export const ThemeToggler = ({ className }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const buttonClasses = cn(
    "flex size-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground [&_svg]:size-[18px]",
    className,
  );

  if (!mounted) return <span aria-hidden className={buttonClasses} />;

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
      className={buttonClasses}
    />
  );
};
