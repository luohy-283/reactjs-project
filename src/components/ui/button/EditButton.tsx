import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";

export type EditButtonProps = Omit<ButtonProps, "children"> & {
  children?: ReactNode;
};

/** Compact table-row edit action (`size="small"` by default). */
export function EditButton({
  children = "Sửa",
  size = "small",
  ...buttonProps
}: EditButtonProps) {
  return (
    <Button size={size} {...buttonProps}>
      {children}
    </Button>
  );
}
