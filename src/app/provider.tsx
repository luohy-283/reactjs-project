import type { ReactNode } from "react";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider } from "@/features/auth/context/AuthContext";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={viVN}>
      <AntApp>
        <AuthProvider>{children}</AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
