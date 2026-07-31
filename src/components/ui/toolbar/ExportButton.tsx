import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { ExportOutlined } from "@ant-design/icons";

export type ExportButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  hideIcon?: boolean;
};

/**
 * Export trigger. Wire `onClick` to a real download API (e.g. CSV export).
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
