import type { ReactNode } from "react";

/** Single side-nav item — `{ key, label }` for AppMenu / React Router nav. */
export type MenuItem = {
  key: string;
  label: ReactNode;
  icon?: string;
  disabled?: boolean;
  items?: MenuItem[];
};

/** Identity helper — keeps menu item arrays typed without a separate factory lib. */
export function defineMenuItems(items: MenuItem[]): MenuItem[] {
  return items;
}
