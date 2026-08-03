import { useContext } from "react";
import {
  ThemeContext,
  type ThemeContextType,
} from "@/app/theme/theme-context";

export function useThemeMode(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return ctx;
}
