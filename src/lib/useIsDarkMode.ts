import { useThemeMode } from "@/app/theme/useThemeMode";

/** True when ThemeProvider is in dark mode. */
export function useIsDarkMode(): boolean {
  return useThemeMode().isDark;
}
