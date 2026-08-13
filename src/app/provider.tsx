import type { ReactNode } from "react";
import { App as AntApp, ConfigProvider, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ThemeProvider } from "@/app/theme/ThemeContext";
import { useThemeMode } from "@/app/theme/useThemeMode";

function ThemedApp({ children }: { children: ReactNode }) {
  const { isDark } = useThemeMode();

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        // Fixed cssVar scope + no hash → switch updates variables in place (no style rebuild flash).
        // Do NOT set cssVar.key to light/dark — that remounts the variable scope and flashes.
        cssVar: {},
        hashed: false,
      }}
    >
      <AntApp>
        <AuthProvider>{children}</AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedApp>{children}</ThemedApp>
    </ThemeProvider>
  );
}
