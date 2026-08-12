import type { ReactNode } from "react";
import { App as AntApp, ConfigProvider, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ThemeProvider } from "@/app/theme/ThemeContext";
import { useThemeMode } from "@/app/theme/useThemeMode";

function ThemedApp({ children }: { children: ReactNode }) {
  const { isDark, mode } = useThemeMode();

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        // CSS variables update more reliably on algorithm switch (antd ≥5.8 / 6).
        cssVar: { key: mode },
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
