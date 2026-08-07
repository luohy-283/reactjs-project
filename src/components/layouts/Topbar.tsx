import type { ReactNode } from "react";
import { Button } from "primereact/button";

export const HEADER_HEIGHT = 64;

export type TopbarProps = {
  /** Brand / product title on the left */
  brand?: ReactNode;
  /** Right slot (typically UserMenu) */
  extra?: ReactNode;
  /** Show hamburger when sidebar is in mobile/collapsed mode. */
  showMenuToggle?: boolean;
  menuCollapsed?: boolean;
  onMenuToggle?: () => void;
};

/** App shell header — brand left, actions right. Outside the content scroll area. */
export function Topbar({
  brand = "Hệ thống Đặt phòng họp",
  extra,
  showMenuToggle = false,
  menuCollapsed = false,
  onMenuToggle,
}: TopbarProps) {
  return (
    <header
      style={{
        zIndex: 100,
        width: "100%",
        height: HEADER_HEIGHT,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        flexShrink: 0,
        background: "var(--p-primary-color, #3B82F6)",
        color: "var(--p-primary-contrast-color, #fff)",
        lineHeight: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {showMenuToggle ? (
          <Button
            type="button"
            text
            rounded
            aria-label={menuCollapsed ? "Mở menu" : "Đóng menu"}
            icon={menuCollapsed ? "pi pi-bars" : "pi pi-times"}
            onClick={onMenuToggle}
            style={{ color: "#fff", fontSize: 18 }}
          />
        ) : null}
        <div
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {brand}
        </div>
      </div>
      {extra}
    </header>
  );
}
