import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export type RefreshButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  /** Hide the reload icon. */
  hideIcon?: boolean;
};

/** Reload list data (wire to hook `refetch`). */
export function RefreshButton({
  children = "Làm mới",
  hideIcon = false,
  ...buttonProps
}: RefreshButtonProps) {
  return (
    <Button
      icon={hideIcon ? undefined : <ReloadOutlined />}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
