import { createContext } from "react";
import type { ThemeMode } from "@/lib/theme-storage";

export type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);
