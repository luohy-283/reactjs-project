import type { TabsProps } from "antd";

/** One antd Tabs `items` entry — company alias for Ant Design v5+ items API. */
export type TabItem = NonNullable<TabsProps["items"]>[number];

/** Identity helper — keeps tab item objects typed without a React component. */
export function defineTabItem(item: TabItem): TabItem {
  return item;
}

/** Identity helper for a full `items` array. */
export function defineTabItems(items: TabItem[]): TabItem[] {
  return items;
}
