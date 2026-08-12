import { theme } from "antd";

/** True when ConfigProvider uses `theme.darkAlgorithm`. */
export function useIsDarkMode(): boolean {
  const { token } = theme.useToken();
  const bg = token.colorBgBase.trim().toLowerCase();
  // Ant Design darkAlgorithm uses #000 / #000000; avoid fragile exact match only.
  return bg === "#000" || bg === "#000000" || bg === "rgb(0, 0, 0)";
}
