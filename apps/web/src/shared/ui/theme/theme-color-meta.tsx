"use client";

import { themeColorScript } from "./theme-colors";
import { useThemeColor } from "./use-theme-color";

export const ThemeColorMeta = (): React.JSX.Element => {
  const color = useThemeColor();

  return (
    <>
      <meta name="theme-color" content={color} suppressHydrationWarning />
      <script dangerouslySetInnerHTML={{ __html: themeColorScript }} />
    </>
  );
};
