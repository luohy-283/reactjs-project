import type { ReactNode } from "react";
import { Space } from "antd";
import type { SpaceProps } from "antd";

export type TableRowActionsProps = Omit<SpaceProps, "children"> & {
  children: ReactNode;
};

/** Horizontal action buttons inside a table actions column. */
export function TableRowActions({
  size = "small",
  children,
  ...spaceProps
}: TableRowActionsProps) {
  return (
    <Space size={size} {...spaceProps}>
      {children}
    </Space>
  );
}
