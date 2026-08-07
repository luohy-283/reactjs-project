import { Button } from "primereact/button";

export type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

/** Header theme switch — props only (no context imports). */
export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      type="button"
      text
      rounded
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Giao diện sáng" : "Giao diện tối"}
      icon={isDark ? "pi pi-sun" : "pi pi-moon"}
      onClick={onToggle}
      style={{
        color: "#fff",
        fontSize: 18,
        width: 40,
        height: 40,
      }}
    />
  );
}
