import type { ReactNode } from "react";
import { Layout } from "antd";

const { Sider } = Layout;

export type SidebarProps = {
  children: ReactNode;
  width?: number;
  breakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  collapsedWidth?: number;
};

/** Ant Design Sider wrapper for the app shell. */
export function Sidebar({
  children,
  width = 220,
  breakpoint = "lg",
  collapsedWidth = 0,
}: SidebarProps) {
  return (
    <Sider breakpoint={breakpoint} collapsedWidth={collapsedWidth} width={width}>
      {children}
    </Sider>
  );
}
