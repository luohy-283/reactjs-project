import type { MenuProps } from "antd";

/** Single side-nav item — `{ key, label }` matching Ant Design Menu items. */
export type MenuItem = NonNullable<MenuProps["items"]>[number];

/** Identity helper — keeps menu item arrays typed without a separate factory lib. */
export function defineMenuItems(items: MenuItem[]): MenuItem[] {
  return items;
}
