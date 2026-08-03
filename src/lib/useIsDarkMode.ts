import { theme } from "antd";

/** True when ConfigProvider uses `theme.darkAlgorithm`. */
export function useIsDarkMode(): boolean {
  const { token } = theme.useToken();
  return token.colorBgBase === "#000";
}
