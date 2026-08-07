import type { ReactNode } from "react";
import { Button, Layout } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const { Header } = Layout;

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
    <Header
      style={{
        zIndex: 100,
        width: "100%",
        height: HEADER_HEIGHT,
        lineHeight: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {showMenuToggle ? (
          <Button
            type="text"
            aria-label={menuCollapsed ? "Mở menu" : "Đóng menu"}
            icon={menuCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
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
    </Header>
  );
}
