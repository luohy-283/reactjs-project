import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readThemeMode,
  writeThemeMode,
  type ThemeMode,
} from "@/lib/theme-storage";
import { ThemeContext } from "@/app/theme/theme-context";

function applyDocumentTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const initial = readThemeMode();
    applyDocumentTheme(initial);
    return initial;
  });

  useEffect(() => {
    applyDocumentTheme(mode);
    writeThemeMode(mode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      toggleTheme,
    }),
    [mode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
