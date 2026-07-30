import type { ReactNode } from "react";
import { Layout } from "antd";

const { Header } = Layout;

export type TopbarProps = {
  /** Brand / product title on the left */
  brand?: ReactNode;
  /** Right slot (typically UserMenu) */
  extra?: ReactNode;
};

/** App shell header — brand left, actions right. */
export function Topbar({
  brand = "Hệ thống Đặt phòng họp",
  extra,
}: TopbarProps) {
  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
      }}
    >
      <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{brand}</div>
      {extra}
    </Header>
  );
}
