export type ThemeMode = "light" | "dark";

export const THEME_MODE_KEY = "theme-mode";

export function readThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_MODE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function writeThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_MODE_KEY, mode);
}
