import type { ReactNode } from "react";
import { Layout } from "antd";
import { HEADER_HEIGHT } from "@/components/layouts/Topbar";

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
};

/** Ant Design Sider — sticky under the topbar so menu stays visible while scrolling. */
export function Sidebar({
  children,
  width = 220,
  breakpoint = "lg",
  collapsedWidth = 0,
  collapsed,
  onCollapse,
  onBreakpoint,
}: SidebarProps) {
  return (
    <Sider
      breakpoint={breakpoint}
      collapsedWidth={collapsedWidth}
      width={width}
      collapsed={collapsed}
      collapsible
      trigger={null}
      onCollapse={(next) => onCollapse?.(next)}
      onBreakpoint={(broken) => onBreakpoint?.(broken)}
      style={{
        position: "sticky",
        top: HEADER_HEIGHT,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        overflow: "auto",
        zIndex: 90,
      }}
    >
      {children}
    </Sider>
  );
}
