import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { ExportOutlined } from "@ant-design/icons";

export type ExportButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  hideIcon?: boolean;
};

/**
 * Export trigger wrapper. Wire `onClick` only when a real export API exists —
 * do not invent client-only CSV downloads.
 */
export function ExportButton({
  children = "Xuất",
  hideIcon = false,
  ...buttonProps
}: ExportButtonProps) {
  return (
    <Button
      icon={hideIcon ? undefined : <ExportOutlined />}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
