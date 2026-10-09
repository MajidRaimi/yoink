export const themeColors = {
  light: "#faf9f7",
  dark: "#0a0908",
} as const;

export const themeStorageKey = "theme";

export const themeColorFor = (theme: string | undefined): string =>
  theme === "dark" ? themeColors.dark : themeColors.light;

export const themeColorScript = `(function(){try{var m=document.querySelector('meta[name="theme-color"]');if(!m)return;var s=localStorage.getItem(${JSON.stringify(themeStorageKey)});var d=s==="dark"||((!s||s==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);m.setAttribute("content",d?${JSON.stringify(themeColors.dark)}:${JSON.stringify(themeColors.light)});}catch(e){}})();`;
