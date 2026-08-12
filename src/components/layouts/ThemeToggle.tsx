import { Button, theme } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";

export type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

/** Header theme switch — props only (no context imports). */
export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const { token } = theme.useToken();
  return (
    <Button
      type="text"
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Giao diện sáng" : "Giao diện tối"}
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={onToggle}
      style={{
        color: token.colorText,
        fontSize: 18,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
