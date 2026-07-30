import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { ImportOutlined } from "@ant-design/icons";

export type ImportButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  hideIcon?: boolean;
};

/**
 * Import trigger wrapper. Wire `onClick` / Upload only when a real import API exists.
 */
export function ImportButton({
  children = "Nhập",
  hideIcon = false,
  ...buttonProps
}: ImportButtonProps) {
  return (
    <Button
      icon={hideIcon ? undefined : <ImportOutlined />}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
