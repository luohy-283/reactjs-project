import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";

export type DeleteButtonProps = Omit<ButtonProps, "children" | "danger"> & {
  children?: ReactNode;
};

/** Compact table-row destructive action (`size="small"` + `danger`). */
export function DeleteButton({
  children = "Xóa",
  size = "small",
  ...buttonProps
}: DeleteButtonProps) {
  return (
    <Button danger size={size} {...buttonProps}>
      {children}
    </Button>
  );
}
