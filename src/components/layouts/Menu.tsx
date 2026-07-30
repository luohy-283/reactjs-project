import { Menu as AntMenu } from "antd";
import type { MenuProps } from "antd";
import type { MenuItem } from "@/components/layouts/MenuItem";

export type AppMenuProps = {
  items: MenuItem[];
  selectedKeys?: string[];
  onClick?: MenuProps["onClick"];
  theme?: MenuProps["theme"];
  mode?: MenuProps["mode"];
};

/** Ant Design Menu wrapper for the app shell side nav (named AppMenu to avoid clashing with antd Menu). */
export function AppMenu({
  items,
  selectedKeys,
  onClick,
  theme = "dark",
  mode = "inline",
}: AppMenuProps) {
  return (
    <AntMenu
      theme={theme}
      mode={mode}
      selectedKeys={selectedKeys}
      items={items}
      onClick={onClick}
      style={{ height: "100%" }}
    />
  );
}
