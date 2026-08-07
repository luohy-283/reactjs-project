import type { ReactNode } from "react";

/** One TabBar `items` entry — company alias matching previous Ant Tabs items. */
export type TabItem = {
  key: string;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  closable?: boolean;
};

/** Identity helper — keeps tab item objects typed without a React component. */
export function defineTabItem(item: TabItem): TabItem {
  return item;
}

/** Identity helper for a full `items` array. */
export function defineTabItems(items: TabItem[]): TabItem[] {
  return items;
}
