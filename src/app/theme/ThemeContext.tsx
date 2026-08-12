import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  readThemeMode,
  writeThemeMode,
  type ThemeMode,
} from "@/lib/theme-storage";
import { ThemeContext } from "@/app/theme/theme-context";

const THEME_SWITCH_CLASS = "theme-switching";

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
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const switchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    applyDocumentTheme(mode);
    writeThemeMode(mode);
  }, [mode]);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current != null) {
        window.clearTimeout(switchTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = modeRef.current === "dark" ? "light" : "dark";
    const root = document.documentElement;
    // Suppress CSS transitions for one frame so badge / table / button don't lag mid-tween.
    root.classList.add(THEME_SWITCH_CLASS);
    applyDocumentTheme(next);
    writeThemeMode(next);
    setMode(next);
    if (switchTimerRef.current != null) {
      window.clearTimeout(switchTimerRef.current);
    }
    switchTimerRef.current = window.setTimeout(() => {
      root.classList.remove(THEME_SWITCH_CLASS);
      switchTimerRef.current = null;
    }, 50);
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
