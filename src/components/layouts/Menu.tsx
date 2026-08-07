import type { MenuItem } from "@/components/layouts/MenuItem";

export type AppMenuProps = {
  items: MenuItem[];
  selectedKeys?: string[];
  onClick?: (info: { key: string }) => void;
  /** Kept for API compat; dark styling via CSS class. */
  theme?: "dark" | "light";
  mode?: "inline" | "horizontal" | "vertical";
};

/** Side-nav menu — preserves `selectedKeys` + `onClick({ key })` for React Router. */
export function AppMenu({
  items,
  selectedKeys = [],
  onClick,
  theme = "dark",
}: AppMenuProps) {
  return (
    <nav
      className={`app-side-menu app-side-menu--${theme}`}
      style={{ height: "100%", padding: "8px 0" }}
      aria-label="Menu chính"
    >
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) => {
          const selected = selectedKeys.includes(item.key);
          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={item.disabled}
                className={selected ? "app-side-menu__item is-active" : "app-side-menu__item"}
                onClick={() => onClick?.({ key: item.key })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  border: "none",
                  background: selected
                    ? "var(--p-primary-color, #3B82F6)"
                    : "transparent",
                  color: selected
                    ? "var(--p-primary-contrast-color, #fff)"
                    : theme === "dark"
                      ? "rgba(255,255,255,0.85)"
                      : "inherit",
                  padding: "10px 20px",
                  cursor: item.disabled ? "not-allowed" : "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  opacity: item.disabled ? 0.5 : 1,
                }}
              >
                {item.icon ? <i className={item.icon} /> : null}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
