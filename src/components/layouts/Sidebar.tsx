import type { ReactNode } from "react";
import { Layout } from "antd";

const { Sider } = Layout;

export type SidebarProps = {
  children: ReactNode;
  width?: number;
  breakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  collapsedWidth?: number;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  /** `true` when viewport is below `breakpoint`. */
  onBreakpoint?: (broken: boolean) => void;
  /** Follow app light/dark — Ant Design Sider defaults to always-dark. */
  theme?: "light" | "dark";
};

/** Ant Design Sider — fills shell height under Topbar; menu scrolls inside if needed. */
export function Sidebar({
  children,
  width = 220,
  breakpoint = "lg",
  collapsedWidth = 0,
  collapsed,
  onCollapse,
  onBreakpoint,
  theme = "light",
}: SidebarProps) {
  return (
    <Sider
      theme={theme}
      breakpoint={breakpoint}
      collapsedWidth={collapsedWidth}
      width={width}
      collapsed={collapsed}
      collapsible
      trigger={null}
      onCollapse={(next) => onCollapse?.(next)}
      onBreakpoint={(broken) => onBreakpoint?.(broken)}
      style={{
        height: "100%",
        overflow: "auto",
        zIndex: 90,
      }}
    >
      {children}
    </Sider>
  );
}
