import { Tabs } from "antd";
import type { TabsProps } from "antd";

export type TabBarProps = TabsProps;

/** Thin wrapper around antd `Tabs` (items-based API). */
export function TabBar(props: TabBarProps) {
  return <Tabs {...props} />;
}
